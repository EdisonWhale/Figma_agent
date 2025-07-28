import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from "@config/index";
import {
  InputMessage,
  FunctionCallOutputMessage,
  Tool as LocalToolType,
  ChatMessage as CommonChatMessage,
  MessageRole,
} from "@types";
import { logger } from "@utils/logger";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Type guard to check if a message is a FunctionCallOutput
function isFunctionCallOutput(
  message: any
): message is FunctionCallOutputMessage {
  return (
    message?.type === "function_call_output" &&
    typeof message.call_id === "string" &&
    message.output !== undefined
  );
}

// Interface for detected function calls (keeping same as OpenAI version)
export interface DetectedFunctionCall {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Convert internal message format to Claude API format
 */
function prepareClaudeInput(conversationHistory: Array<InputMessage>): {
  messages: Anthropic.MessageParam[];
  system?: string;
} {
  const messages: Anthropic.MessageParam[] = [];
  let systemMessage: string | undefined;

  for (const message of conversationHistory) {
    // Handle system messages separately for Claude
    if ((message as any).role === "system") {
      systemMessage =
        typeof (message as any).content === "string"
          ? (message as any).content
          : "";
      continue;
    }
    if ((message as any).role === "user") {
      if (typeof (message as any).content === "string") {
        messages.push({
          role: "user",
          content: (message as any).content,
        });
      } else if (Array.isArray((message as any).content)) {
        // Handle mixed content (text + tool results)
        const content: Anthropic.MessageParam["content"] = [];

        for (const item of (message as any).content) {
          if (item.type === "text") {
            content.push({
              type: "text",
              text: item.text,
            });
          } else if (item.type === "tool_result") {
            content.push({
              type: "tool_result",
              tool_use_id: item.tool_use_id,
              content: item.content,
            });
          }
        }

        messages.push({
          role: "user",
          content: content,
        });
      }
    } else if ((message as any).role === "assistant") {
      const content: Anthropic.MessageParam["content"] = [];

      // Add text content if present
      if ((message as any).content) {
        content.push({
          type: "text",
          text: (message as any).content,
        });
      }

      // Handle tool calls from BackendChatMessage format
      if ((message as any).tool_calls) {
        for (const toolCall of (message as any).tool_calls) {
          content.push({
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
          });
        }
      }

      messages.push({
        role: "assistant",
        content: content.length > 0 ? content : (message as any).content || "",
      });
    }
    // Handle function call output messages
    else if (isFunctionCallOutput(message)) {
      // Convert function call output to tool result
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "user") {
        // Add to existing user message
        if (Array.isArray(lastMessage.content)) {
          lastMessage.content.push({
            type: "tool_result",
            tool_use_id: message.call_id,
            content: message.output,
          });
        } else {
          lastMessage.content = [
            { type: "text", text: lastMessage.content as string },
            {
              type: "tool_result",
              tool_use_id: message.call_id,
              content: message.output,
            },
          ];
        }
      } else {
        // Create new user message with tool result
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: message.call_id,
              content: message.output,
            },
          ],
        });
      }
    }
  }

  return { messages, system: systemMessage };
}

/**
 * Convert internal tool format to Claude API format
 */
function convertToolsToClaudeFormat(tools: LocalToolType[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters as Anthropic.Tool.InputSchema, // Claude uses input_schema instead of parameters
  }));
}

/**
 * Generates a chat response using the Claude Messages API (Streaming).
 * Handles text generation and optionally function/tool calls.
 * Maintains the same interface as the OpenAI version.
 */
export async function generateChatResponseStream(
  conversationHistory: Array<InputMessage>,
  previousResponseId: string | undefined, // Ignored for Claude, kept for compatibility
  toolsToUse: LocalToolType[] | undefined,
  onChunk: (chunk: string) => void,
  onFunctionCall: (functionCall: DetectedFunctionCall) => void,
  onComplete: (finalText: string | null, responseId: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const { messages, system } = prepareClaudeInput(conversationHistory);

    const requestPayload: Anthropic.MessageCreateParamsStreaming = {
      model: ANTHROPIC_MODEL,
      messages: messages,
      max_tokens: 4096,
      stream: true,
    };

    if (system) {
      requestPayload.system = system;
    }

    if (toolsToUse && toolsToUse.length > 0) {
      requestPayload.tools = convertToolsToClaudeFormat(toolsToUse);
      requestPayload.tool_choice = { type: "auto" };
    }

    logger.info(
      {
        inputMessages: conversationHistory.length,
        hasTools: !!requestPayload.tools,
        model: ANTHROPIC_MODEL,
      },
      "[Claude] Starting conversation"
    );

    const stream = await anthropic.messages.create(requestPayload);

    let fullTextResponse = "";
    let responseId = "";
    let currentToolCall: DetectedFunctionCall | null = null;
    let toolArgumentsBuffer = "";

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
            currentToolCall = {
              id: event.content_block.id,
              name: event.content_block.name,
              arguments: "",
            };
            toolArgumentsBuffer = "";
          }
          break;

        case "content_block_delta":
          if (event.delta.type === "text_delta") {
            const textChunk = event.delta.text;
            fullTextResponse += textChunk;
            onChunk(textChunk);
          } else if (
            event.delta.type === "input_json_delta" &&
            currentToolCall
          ) {
            toolArgumentsBuffer += event.delta.partial_json;
          }
          break;

        case "content_block_stop":
          if (currentToolCall && toolArgumentsBuffer) {
            currentToolCall.arguments = toolArgumentsBuffer;
            onFunctionCall(currentToolCall);
            currentToolCall = null;
            toolArgumentsBuffer = "";
          }
          break;

        case "message_stop":
          logger.info(
            { responseId, textLength: fullTextResponse.length },
            "[Claude] Response stream completed"
          );
          onComplete(fullTextResponse || null, responseId);
          return;
      }
    }

    // Fallback completion if no message_stop event
    if (responseId) {
      logger.warn(
        { responseId },
        "[Claude] Stream loop finished without message_stop event"
      );
      onComplete(fullTextResponse || null, responseId);
    } else {
      logger.error(
        {},
        "[Claude] Stream loop finished without any events or completion."
      );
      onError(
        new Error("Claude stream ended unexpectedly without completing.")
      );
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error, "[Claude] Error during stream execution/processing");

    if (err instanceof Anthropic.APIError) {
      logger.error(
        {
          status: err.status,
          name: err.name,
          message: err.message,
        },
        "[Claude] API Error details"
      );
      onError(
        new Error(
          `Claude API Error: Status ${err.status}, Message: ${err.message}`
        )
      );
    } else if (err instanceof Error) {
      onError(err);
    } else {
      onError(
        new Error("An unknown error occurred processing the Claude stream.")
      );
    }
  }
}
