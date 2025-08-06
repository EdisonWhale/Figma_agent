/**
 * Common Constants
 * Shared constants between frontend and backend
 */

// Message Role Constants
export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  DEVELOPER: "developer",
  SYSTEM: "system",
} as const;

// Connection Status Constants
export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const;

// WebSocket Message Types
export const WS_MESSAGE_TYPES = {
  // Client to Server
  CHAT_MESSAGE: "chat_message",
  FUNCTION_RESULT: "function_result",

  // Server to Client
  CONNECTION_ESTABLISHED: "connection_established",
  STREAM_START: "stream_start",
  STREAM_CHUNK: "stream_chunk",
  STREAM_END: "stream_end",
  STREAM_ERROR: "stream_error",
  SESSION_UPDATE: "session_update",
  TOOL_CALL: "tool_call",
  ERROR: "error",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_MESSAGE_FORMAT: "INVALID_MESSAGE_FORMAT",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",
} as const;
