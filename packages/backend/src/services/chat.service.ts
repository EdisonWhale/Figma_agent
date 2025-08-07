/**
 * Chat Service
 * Handles AI chat processing and response generation
 */
import { ClaudeService } from "./claude.service";
import { MCPService } from "./mcp.service";
import { InputMessage } from "../types/chat.types";
import { logger } from "@utils/logger";
import { ensureSystemInstruction } from "@config/ai";

export interface ToolCallResult {
  toolName: string;
  toolId: string;
  arguments: Record<string, any>;
  result: string;
  isError: boolean;
}

export interface ChatCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (finalText: string, responseId: string) => void;
  onError: (error: Error) => void;
  onToolCall?: (toolCall: ToolCallResult) => void;
}

export class ChatService {
  private claudeService: ClaudeService;
  private mcpService: MCPService;

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
    this.claudeService = new ClaudeService(mcpService);
  }

  /**
   * Process a chat message and generate AI response
   */
  public async processMessage(
    message: string,
    chatHistory: InputMessage[],
    callbacks: ChatCallbacks,
    sessionId?: string
  ): Promise<void> {
    try {
      logger.info(
        { messageLength: message.length, historyLength: chatHistory.length, sessionId },
        "[Chat] Processing message"
      );

      // Prepare conversation history with system instruction
      const conversationHistory = ensureSystemInstruction([
        ...chatHistory,
        { role: "user", content: message },
      ]);

      // Generate response using Claude service
      await this.claudeService.generateResponse(conversationHistory, callbacks, sessionId);
    } catch (error) {
      logger.error({ error }, "[Chat] Message processing failed");
      callbacks.onError(error as Error);
    }
  }

  /**
   * Validate chat message input
   */
  public validateMessage(message: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!message || typeof message !== "string") {
      return { isValid: false, error: "Message must be a non-empty string" };
    }

    if (message.trim().length === 0) {
      return { isValid: false, error: "Message cannot be empty" };
    }

    if (message.length > 10000) {
      return {
        isValid: false,
        error: "Message too long (max 10000 characters)",
      };
    }

    return { isValid: true };
  }
}
