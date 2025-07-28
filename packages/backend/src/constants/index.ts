/**
 * Application Constants
 * Centralized location for all application constants
 */

// Import shared constants from common package
import {
  WS_MESSAGE_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  CONNECTION_STATUS,
  MESSAGE_ROLES,
} from "@common/index";

// Re-export shared constants
export {
  WS_MESSAGE_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  CONNECTION_STATUS,
  MESSAGE_ROLES,
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_INITIAL_DELAY: 1000, // 1 second
  RECONNECT_MAX_DELAY: 30000, // 30 seconds
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  TTL: 24 * 60 * 60 * 1000, // 24 hours
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;

// AI Model Configuration
export const AI_CONFIG = {
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  DEFAULT_OPENAI_MODEL: "gpt-4.1-2025-04-14",
  DEFAULT_ANTHROPIC_MODEL: "claude-sonnet-4-20250514",
} as const;

// Backend-specific error codes (extend common ones)
export const BACKEND_ERROR_CODES = {
  ...ERROR_CODES,
  CONNECTION_ERROR: "CONNECTION_ERROR",
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "trace",
} as const;

// CORS Origins
export const ALLOWED_ORIGINS = [
  "https://www.figma.com",
  "https://figma.com",
  "https://www.figjam.com",
  "https://figjam.com",
  "http://localhost:3000",
  "null", // For local development
] as const;

// Message Validation Limits
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 10000,
  MIN_LENGTH: 1,
} as const;

// Session Limits
export const SESSION_LIMITS = {
  MAX_HISTORY_LENGTH: 100,
  MAX_CONCURRENT_SESSIONS: 1000,
} as const;

// WebSocket Message Types are imported from common package above

// Default Values
export const DEFAULTS = {
  PORT: 3000,
  NODE_ENV: "development",
  LOG_LEVEL: "info",
  HEARTBEAT_TIMEOUT: 5000,
} as const;
