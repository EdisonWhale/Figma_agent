/**
 * Chat Type Definitions
 */

// Re-export common types
export * from "@common/index";

// Import common types for extension
import {
  MessageRole as CommonMessageRole,
  ChatMessage as CommonChatMessage,
} from "@common/index";

// Extended types for backend use
export type MessageRole = CommonMessageRole;

export interface InputMessage {
  role: MessageRole;
  content: string | null;
}

export interface BackendChatMessage extends CommonChatMessage {
  role: MessageRole;
  content: string | null;
}

// Chat processing types
export interface ChatProcessingOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ChatResponse {
  message: string;
  responseId: string;
  sessionId: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

// Chat history types
export type ChatHistory = BackendChatMessage[];

// Function calling types (for future use)
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface FunctionResult {
  name: string;
  result: any;
  error?: string;
}
