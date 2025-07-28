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

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }

  /**
   * Generate AI response using Claude API
   */
  public async generateResponse(
    conversationHistory: InputMessage[],
    callbacks: ChatCallbacks
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

      for await (const event of stream) {
        switch (event.type) {
          case "message_start":
            responseId = event.message.id;
            logger.info(
              { responseId, model: event.message.model },
              "[Claude] Response stream created"
            );
            break;

          case "content_block_delta":
            if (event.delta.type === "text_delta") {
              const textChunk = event.delta.text;
              fullTextResponse += textChunk;
              tokenCount += textChunk.split(" ").length; // Rough token estimation
              callbacks.onChunk(textChunk);
            }
            break;

          case "message_stop":
            const duration = timer.end();

            logger.info(
              {
                responseId,
                textLength: fullTextResponse.length,
                estimatedTokens: tokenCount,
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
        systemMessage = msg.content || "";
        continue;
      }

      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content || "",
        });
      }
    }

    return { messages, system: systemMessage };
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
