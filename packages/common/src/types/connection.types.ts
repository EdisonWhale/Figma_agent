/**
 * Connection-related type definitions
 * Shared between frontend and backend
 */

// Connection Status Types
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// WebSocket Message Base Interface
export interface WSMessageBase {
  type: string;
  payload?: any;
  timestamp?: string;
}

// Error Response Interface
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Health Check Response Interface
export interface HealthCheckResponse {
  status: "ok" | "error";
  version: string;
  uptime: string;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  sessions: {
    active: number;
  };
  environment: string;
  timestamp: string;
}
