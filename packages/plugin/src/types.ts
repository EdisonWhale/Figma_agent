import { EventHandler } from "@create-figma-plugin/utilities";
import {
  MessageRole as ImportedMessageRole,
  ChatMessage as ImportedChatMessage,
  ChatHistory as ImportedChatHistory,
  ChatResponse as ImportedChatResponse,
} from "../../common/types";

// --- Re-export shared types ---
export type MessageRole = ImportedMessageRole;
export type ChatMessage = ImportedChatMessage;
export type ChatHistory = ImportedChatHistory;
export type ChatResponse = ImportedChatResponse;

// --- Plugin internal communication and state types ---
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

// UI -> Main: Request plugin close
export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}
