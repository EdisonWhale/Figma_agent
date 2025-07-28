/**
 * Plugin Type Definitions
 * Centralized type definitions for the plugin
 */
import { EventHandler } from "@create-figma-plugin/utilities";

// Re-export shared types from common package
export * from "common/index";

// Import shared types for extension
import {
  MessageRole as ImportedMessageRole,
  ChatMessage as ImportedChatMessage,
  ChatHistory as ImportedChatHistory,
  ChatResponse as ImportedChatResponse,
} from "common/index";

// Re-export shared types with local names
export type MessageRole = ImportedMessageRole;
export type ChatMessage = ImportedChatMessage;
export type ChatHistory = ImportedChatHistory;
export type ChatResponse = ImportedChatResponse;

// Connection Status
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

// UI Message Structure
export interface UIMessage {
  text: string;
  isUser: boolean;
  id?: string;
  isComplete?: boolean;
}

// Plugin Event Handlers
export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

// WebSocket Service Callbacks
export interface WebSocketCallbacks {
  onMessage: (message: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onFunctionCall: () => void;
  onChunk: (chunk: string) => void;
  onStreamEnd: (responseId: string) => void;
}

// Component Props
export interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  isComplete?: boolean;
  id?: string;
}

export interface ConnectionStatusProps {
  status: ConnectionStatus;
}

// Hook Return Types
export interface ChatConnectionHook {
  messages: UIMessage[];
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  inputValue: string;
  sendMessage: () => void;
  handleInputChange: (value: string) => void;
  retryConnection: () => void;
}

// Configuration Types
export interface PluginConfig {
  wsBaseUrl: string;
  reconnectMaxAttempts: number;
  reconnectInitialDelay: number;
  reconnectMaxDelay: number;
}

// WebSocket Message Types
export interface WSMessage {
  type: string;
  payload?: any;
}

export interface ChatMessagePayload {
  message: string;
  sessionId?: string;
}

export interface StreamChunkPayload {
  text: string;
  functionCall?: any;
}

export interface StreamEndPayload {
  responseId: string;
  sessionId?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
