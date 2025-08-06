import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from "@config/index";
import {
  InputMessage,
  ChatMessage as CommonChatMessage,
  MessageRole,
} from "../types/chat.types";
import { logger } from "@utils/logger";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

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

      messages.push({
        role: "assistant",
        content: (message as any).content || "",
      });
    }
  }

  return { messages, system: systemMessage };
}

/**
 * Generates a chat response using the Claude Messages API (Streaming).
 * Simplified version without function calling support.
 */
export async function generateChatResponseStream(
  conversationHistory: Array<InputMessage>,
  onChunk: (chunk: string) => void,
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

    logger.info(
      {
        inputMessages: conversationHistory.length,
        model: ANTHROPIC_MODEL,
      },
      "[Claude] Starting conversation"
    );

    const stream = await anthropic.messages.create(requestPayload);

    let fullTextResponse = "";
    let responseId = "";

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
            onChunk(textChunk);
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
