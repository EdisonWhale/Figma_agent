export type MessageRole = "user" | "assistant" | "developer" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string | null;
}

export type ChatHistory = ChatMessage[];

export interface ChatResponse {
  message: string;
  responseId: string;
  sessionId: string;
  output_text?: string;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";
