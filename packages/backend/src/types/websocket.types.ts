/**
 * WebSocket Type Definitions
 */
import { WebSocket } from "ws";

// WebSocket Client Interface
export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  sessionId: string | null;
}

// WebSocket Message Types
export type ClientToServerMessageType = "chat_message" | "function_result";

export type ServerToClientMessageType =
  | "connection_established"
  | "stream_start"
  | "stream_chunk"
  | "stream_end"
  | "stream_error"
  | "session_update"
  | "tool_call"
  | "error";

// Base WebSocket Message Interface
export interface WSMessageBase {
  type: ClientToServerMessageType | ServerToClientMessageType;
  payload?: any;
}

// Specific Message Interfaces
export interface ConnectionEstablishedMessage extends WSMessageBase {
  type: "connection_established";
  payload: {
    clientId: string;
    sessionId?: string;
  };
}

export interface SessionUpdateMessage extends WSMessageBase {
  type: "session_update";
  payload: {
    sessionId: string;
  };
}

export interface StreamStartMessage extends WSMessageBase {
  type: "stream_start";
  payload: {
    sessionId: string;
  };
}

export interface StreamChunkMessage extends WSMessageBase {
  type: "stream_chunk";
  payload: {
    text: string;
    functionCall?: any;
  };
}

export interface StreamEndMessage extends WSMessageBase {
  type: "stream_end";
  payload: {
    responseId: string;
    sessionId: string;
  };
}

export interface StreamErrorMessage extends WSMessageBase {
  type: "stream_error";
  payload: {
    message: string;
  };
}

export interface ToolCallMessage extends WSMessageBase {
  type: "tool_call";
  payload: {
    toolName: string;
    toolId: string;
    arguments: Record<string, any>;
    result: string;
    isError: boolean;
  };
}

export interface ErrorMessage extends WSMessageBase {
  type: "error";
  payload: {
    code: string;
    message: string;
  };
}

export interface ChatMessageRequest extends WSMessageBase {
  type: "chat_message";
  payload: {
    message: string;
    sessionId?: string;
  };
}

// Union type for all WebSocket messages
export type WSMessage =
  | ConnectionEstablishedMessage
  | SessionUpdateMessage
  | StreamStartMessage
  | StreamChunkMessage
  | StreamEndMessage
  | StreamErrorMessage
  | ToolCallMessage
  | ErrorMessage
  | ChatMessageRequest;

// Type guards
export function isChatMessageRequest(
  message: any
): message is ChatMessageRequest {
  return (
    message?.type === "chat_message" &&
    typeof message?.payload?.message === "string"
  );
}

export function isWSMessage(message: any): message is WSMessage {
  return (
    message &&
    typeof message.type === "string" &&
    (message.payload === undefined || typeof message.payload === "object")
  );
}
