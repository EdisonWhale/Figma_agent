/**
 * Chat-related type definitions
 * Shared between frontend and backend
 */

// Message Role Types
export type MessageRole = "user" | "assistant" | "developer" | "system";

// Basic Chat Message Interface
export interface ChatMessage {
  role: MessageRole;
  content: string | null;
}

// Chat History Type
export type ChatHistory = ChatMessage[];

// Chat Response Interface
export interface ChatResponse {
  message: string;
  responseId: string;
  sessionId: string;
  output_text?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

// Input Message Interface (for API requests)
export interface InputMessage {
  role: MessageRole;
  content: string | null;
}

// Message Validation Interface
export interface MessageValidation {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}
