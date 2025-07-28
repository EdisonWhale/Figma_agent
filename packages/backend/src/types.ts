import { ChatMessage as CommonChatMessage, MessageRole } from "@common/types";
// Re-export common types if needed elsewhere in the backend
export * from "@common/types";

// Extend the common ChatMessage for backend's internal history storage
export interface BackendChatMessage extends CommonChatMessage {
  role: MessageRole;
  content: string | null;
}

// Union type for messages that can be stored in the session history
export type HistoryMessage = BackendChatMessage;

// Union type for messages sent to the API input array
export type InputMessage = CommonChatMessage;

// Type for structured logging entries
export interface LogEntry {
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  timestamp: string;
  message: string;
  [key: string]: any; // Allow additional context fields
}
