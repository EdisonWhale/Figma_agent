/**
 * Claude Service
 * Handles communication with Anthropic's Claude API
 */
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from "@config/index";
import { InputMessage } from "../types/chat.types";
import { logger } from "@utils/logger";
import { AI_CONFIG } from "@constants/index";
import { ChatCallbacks } from "./chat.service";
import { AIServiceError, logError, retryOperation } from "@utils/error.utils";
import { MetricsCollector, PerformanceTimer } from "@utils/performance.utils";
import { MCPService } from "./mcp.service";

export class ClaudeService {
  private anthropic: Anthropic;
  private mcpService: MCPService;

  constructor(mcpService: MCPService) {
    this.anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    this.mcpService = mcpService;
  }

  /**
   * Generate AI response using Claude API
   */
  public async generateResponse(
    conversationHistory: InputMessage[],
    callbacks: ChatCallbacks,
    sessionId?: string
  ): Promise<void> {
    const timer = new PerformanceTimer("Claude.generateResponse", {
      messageCount: conversationHistory.length,
      model: ANTHROPIC_MODEL,
    });

    try {
      const { messages, system } = this.prepareClaudeInput(conversationHistory);

      const requestPayload: Anthropic.MessageCreateParamsStreaming = {
        model: ANTHROPIC_MODEL,
        messages: messages,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        stream: true,
        temperature: AI_CONFIG.TEMPERATURE,
        tools: this.getMCPTools(),
      };

      if (system) {
        requestPayload.system = system;
      }

      logger.info(
        {
          model: ANTHROPIC_MODEL,
          messageCount: messages.length,
          hasSystem: !!system,
          maxTokens: AI_CONFIG.MAX_TOKENS,
          temperature: AI_CONFIG.TEMPERATURE,
        },
        "[Claude] Generating response"
      );

      const stream = await retryOperation(
        () => this.anthropic.messages.create(requestPayload),
        3,
        1000,
        "Claude.createMessage"
      );

      let fullTextResponse = "";
      let responseId = "";
      let tokenCount = 0;
      let toolCalls: any[] = [];

      for await (const event of stream) {
        switch (event.type) {
          case "message_start":
            responseId = event.message.id;
            logger.info(
              { responseId, model: event.message.model },
              "[Claude] Response stream created"
            );
            break;

          case "content_block_start":
            if (event.content_block.type === "tool_use") {
              logger.debug(
                {
                  toolName: event.content_block.name,
                  toolId: event.content_block.id,
                  input: event.content_block.input,
                  contentBlockIndex: event.index,
                },
                "[Claude] Tool call detected"
              );
              // Store the tool call with its content block index for delta mapping
              const toolCall = { 
                ...event.content_block, 
                contentBlockIndex: event.index,
                inputJson: '' 
              };
              toolCalls.push(toolCall);
            }
            break;

          case "content_block_delta":
            if (event.delta.type === "text_delta") {
              const textChunk = event.delta.text;
              fullTextResponse += textChunk;
              tokenCount += textChunk.split(" ").length; // Rough token estimation
              callbacks.onChunk(textChunk);
            } else if (event.delta.type === "input_json_delta") {
              // Handle tool call parameter delta updates
              logger.debug(
                {
                  contentBlockIndex: event.index,
                  delta: event.delta.partial_json,
                },
                "[Claude] Tool input delta received"
              );
              
              // Find the tool call by content block index
              const toolCall = toolCalls.find(tc => tc.contentBlockIndex === event.index);
              if (toolCall) {
                // Accumulate the JSON for this tool call
                toolCall.inputJson += event.delta.partial_json;
                
                logger.debug(
                  {
                    toolId: toolCall.id,
                    currentJson: toolCall.inputJson,
                    deltaAdded: event.delta.partial_json,
                  },
                  "[Claude] Tool input JSON accumulated"
                );
              } else {
                logger.warn(
                  {
                    contentBlockIndex: event.index,
                    availableIndexes: toolCalls.map(tc => tc.contentBlockIndex),
                  },
                  "[Claude] Could not find tool call for input delta"
                );
              }
            }
            break;

          case "message_stop":
            // Handle tool calls if any
            if (toolCalls.length > 0) {
              // Execute tools and continue conversation with tool results
              await this.handleToolCallsAndContinue(toolCalls, conversationHistory, callbacks, timer, sessionId);
              return; // Don't call onComplete here, will be called after tool result processing
            }

            const duration = timer.end();

            logger.info(
              {
                responseId,
                textLength: fullTextResponse.length,
                estimatedTokens: tokenCount,
                toolCallsCount: toolCalls.length,
                duration: `${duration.toFixed(2)}ms`,
              },
              "[Claude] Response stream completed"
            );

            // Record metrics
            MetricsCollector.recordMetric("claude.response.duration", duration);
            MetricsCollector.recordMetric("claude.response.tokens", tokenCount);
            MetricsCollector.recordMetric(
              "claude.response.length",
              fullTextResponse.length
            );

            callbacks.onComplete(fullTextResponse || "", responseId);
            return;
        }
      }
    } catch (error) {
      const duration = timer.getDuration();

      logError(error as Error, "Claude.generateResponse", {
        model: ANTHROPIC_MODEL,
        messageCount: conversationHistory.length,
        duration: duration ? `${duration.toFixed(2)}ms` : "unknown",
      });

      MetricsCollector.recordMetric("claude.response.errors", 1);

      // Wrap in AIServiceError for better error handling
      const aiError = new AIServiceError(
        `Claude API error: ${(error as Error).message}`,
        error as Error
      );

      callbacks.onError(aiError);
    }
  }

  /**
   * Convert internal message format to Claude API format
   */
  private prepareClaudeInput(conversationHistory: InputMessage[]): {
    messages: Anthropic.MessageParam[];
    system?: string;
  } {
    const messages: Anthropic.MessageParam[] = [];
    let systemMessage: string | undefined;

    for (const msg of conversationHistory) {
      if (msg.role === "system") {
        // Handle different content types for system messages
        if (typeof msg.content === "string") {
          systemMessage = msg.content || "";
        } else if (msg.content) {
          // Convert array or other types to string for system messages
          systemMessage = Array.isArray(msg.content) 
            ? JSON.stringify(msg.content) 
            : String(msg.content);
        } else {
          systemMessage = "";
        }
        continue;
      }

      if (msg.role === "user" || msg.role === "assistant") {
        // Handle both string content and structured content (for tool_use/tool_result)
        let content: string | any[];
        if (typeof msg.content === "string") {
          content = msg.content || "";
        } else if (Array.isArray(msg.content)) {
          content = msg.content;
        } else {
          content = msg.content || "";
        }

        messages.push({
          role: msg.role,
          content: content as any, // Allow structured content for Claude API
        });
      }
    }

    return { messages, system: systemMessage };
  }

  /**
   * Handle tool calls and continue conversation with results
   */
  private async handleToolCallsAndContinue(
    toolCalls: any[],
    conversationHistory: InputMessage[],
    callbacks: ChatCallbacks,
    timer: any,
    sessionId?: string
  ): Promise<void> {
    try {
      // Execute all tool calls and collect results
      const toolResults: any[] = [];
      
      for (const toolCall of toolCalls) {
        try {
          // Parse accumulated JSON input if available
          let toolInput = toolCall.input || {};
          if (toolCall.inputJson && toolCall.inputJson.length > 0) {
            try {
              toolInput = JSON.parse(toolCall.inputJson);
            } catch (parseError) {
              logger.error(
                {
                  toolName: toolCall.name,
                  rawJson: toolCall.inputJson,
                  error: parseError,
                },
                "[Claude] Failed to parse tool input JSON"
              );
              toolInput = toolCall.input || {};
            }
          }

          logger.info(
            { 
              toolName: toolCall.name, 
              toolId: toolCall.id,
              input: toolInput,
            },
            "[Claude] Executing tool call"
          );

          // Call MCP tool with session ID for special ID resolution
          const result = await this.mcpService.callTool({
            name: toolCall.name,
            arguments: toolInput,
            sessionId,
          });

          // Immediately extract and save created element ID for session context
          if (!result.isError && toolCall.name.startsWith('create_') && sessionId) {
            try {
              const resultText = result.content[0]?.text || "";
              const elementId = this.extractElementIdFromResult(resultText);
              
              if (elementId) {
                const elementType = toolCall.name.replace('create_', '');
                const createdElement = {
                  id: elementId,
                  type: elementType,
                  text: toolInput.text || undefined,
                  color: toolInput.color || undefined,
                  x: toolInput.x || undefined,
                  y: toolInput.y || undefined,
                  toolCall: toolCall.name,
                };
                
                // Store element info directly with mcpService session reference
                if (this.mcpService.hasSessionService()) {
                  await this.mcpService.saveCreatedElement(sessionId, createdElement);
                }
                
                logger.info(
                  { sessionId, elementId, toolName: toolCall.name },
                  "[Claude] Created element saved to session synchronously"
                );
              }
            } catch (error) {
              logger.warn(
                { error, toolCall: toolCall.name },
                "[Claude] Failed to extract element ID from tool result"
              );
            }
          }

          // Notify callbacks for internal processing
          if (callbacks.onToolCall) {
            callbacks.onToolCall({
              toolName: toolCall.name,
              toolId: toolCall.id,
              arguments: toolInput,
              result: result.content[0]?.text || "Tool executed successfully",
              isError: result.isError || false,
            });
          }

          // Prepare tool result for Claude API
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: result.content[0]?.text || "Tool executed successfully",
            is_error: result.isError || false,
          });

        } catch (error) {
          logger.error(
            { toolName: toolCall.name, error },
            "[Claude] Tool call failed"
          );

          // Add error result
          toolResults.push({
            type: "tool_result", 
            tool_use_id: toolCall.id,
            content: `Tool call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            is_error: true,
          });
        }
      }

      // Create assistant message with tool use blocks
      const assistantContent = [
        ...toolCalls.map(tc => {
          let input = tc.input || {};
          if (tc.inputJson && tc.inputJson.length > 0) {
            try {
              input = JSON.parse(tc.inputJson);
            } catch (parseError) {
              input = tc.input || {};
            }
          }
          return {
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input,
          };
        }),
      ];

      const assistantMessage: InputMessage = {
        role: "assistant",
        content: assistantContent,
      };

      // Create user message with tool results
      const toolResultMessage: InputMessage = {
        role: "user", 
        content: toolResults,
      };

      // Continue conversation with tool results
      const newConversationHistory = [
        ...conversationHistory,
        assistantMessage,
        toolResultMessage,
      ];

      logger.info(
        { toolResultsCount: toolResults.length },
        "[Claude] Continuing conversation with tool results"
      );

      // Recursively generate response with tool results
      await this.generateResponse(newConversationHistory, callbacks, sessionId);
      
    } catch (error) {
      const duration = timer.getDuration();
      
      logError(error as Error, "Claude.handleToolCallsAndContinue", {
        toolCallsCount: toolCalls.length,
        duration: duration ? `${duration.toFixed(2)}ms` : "unknown",
      });

      callbacks.onError(new AIServiceError(
        `Tool processing error: ${(error as Error).message}`,
        error as Error
      ));
    }
  }

  /**
   * Handle tool calls from Claude (removed - no longer used)
   */
  private async handleToolCalls(
    toolCalls: any[],
    callbacks: ChatCallbacks
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      try {
        // Parse accumulated JSON input if available
        let toolInput = toolCall.input || {};
        if (toolCall.inputJson && toolCall.inputJson.length > 0) {
          try {
            toolInput = JSON.parse(toolCall.inputJson);
            logger.debug(
              { 
                toolName: toolCall.name,
                rawJson: toolCall.inputJson,
                parsedInput: toolInput,
              },
              "[Claude] Parsed tool input from JSON delta"
            );
          } catch (parseError) {
            logger.error(
              {
                toolName: toolCall.name,
                rawJson: toolCall.inputJson,
                error: parseError,
              },
              "[Claude] Failed to parse tool input JSON"
            );
            // Fall back to original input
            toolInput = toolCall.input || {};
          }
        }

        logger.info(
          { 
            toolName: toolCall.name, 
            toolId: toolCall.id,
            input: toolInput,
            hasInput: Object.keys(toolInput || {}).length > 0,
            inputKeys: Object.keys(toolInput || {}),
            hasInputJson: !!(toolCall.inputJson && toolCall.inputJson.length > 0),
            inputJsonLength: toolCall.inputJson?.length || 0,
            contentBlockIndex: toolCall.contentBlockIndex,
          },
          "[Claude] Executing tool call"
        );

        // Call MCP tool
        const result = await this.mcpService.callTool({
          name: toolCall.name,
          arguments: toolInput,
        });

        // Send tool result back to callbacks
        if (callbacks.onToolCall) {
          callbacks.onToolCall({
            toolName: toolCall.name,
            toolId: toolCall.id,
            arguments: toolInput,
            result: result.content[0]?.text || "Tool executed successfully",
            isError: result.isError || false,
          });
        }

        // Note: Tool result is handled via onToolCall callback for internal processing
        // User interface should not show technical tool call details
      } catch (error) {
        logger.error(
          { toolName: toolCall.name, error },
          "[Claude] Tool call failed"
        );

        if (callbacks.onToolCall) {
          callbacks.onToolCall({
            toolName: toolCall.name,
            toolId: toolCall.id,
            arguments: toolCall.input,
            result: `Tool call failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            isError: true,
          });
        }

        callbacks.onChunk(
          `\n\n❌ **${toolCall.name}** failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }\n\n`
        );
      }
    }
  }

  /**
   * Get MCP tools formatted for Claude API
   */
  private getMCPTools(): Anthropic.Tool[] {
    if (!this.mcpService.isConnectedToMCP()) {
      return [];
    }

    const mcpTools = this.mcpService.getTools();
    const claudeTools = mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    // DEBUG: Log the actual tool definitions sent to Claude
    logger.info(
      {
        toolCount: claudeTools.length,
        sampleTool: claudeTools.find(t => t.name === 'create_sticky_note'),
      },
      "[Claude] Tools formatted for Claude API"
    );

    return claudeTools;
  }

  /**
   * Extract element ID from tool result text
   */
  private extractElementIdFromResult(resultText: string): string | null {
    try {
      // Try to parse as JSON first (structured response)
      const parsed = JSON.parse(resultText);
      if (parsed.elementId) return parsed.elementId;
      if (parsed.stickyId) return parsed.stickyId;
    } catch {
      // Fall back to regex pattern matching for text responses
      const patterns = [
        /(?:elementId|stickyId)[:\s]+"?([A-Za-z0-9_:-]+)"?/i,
        /ID[:\s]+"?([A-Za-z0-9_:-]+)"?/i,
        /\(ID[:\s]+([A-Za-z0-9_:-]+)\)/i,
      ];
      
      for (const pattern of patterns) {
        const match = resultText.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    
    return null;
  }

  /**
   * Validate Claude API configuration
   */
  public validateConfiguration(): { isValid: boolean; error?: string } {
    if (!ANTHROPIC_API_KEY) {
      return { isValid: false, error: "ANTHROPIC_API_KEY is not configured" };
    }

    if (!ANTHROPIC_MODEL) {
      return { isValid: false, error: "ANTHROPIC_MODEL is not configured" };
    }

    return { isValid: true };
  }
}
