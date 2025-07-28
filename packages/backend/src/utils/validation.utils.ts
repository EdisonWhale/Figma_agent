/**
 * Validation Utility Functions
 */
import { ValidationResult } from "../types/chat.types";
import {
  ERROR_CODES,
  MESSAGE_LIMITS,
  WS_MESSAGE_TYPES,
} from "@constants/index";

/**
 * Validate chat message
 */
export function validateChatMessage(message: any): ValidationResult {
  if (!message) {
    return {
      isValid: false,
      error: "Message is required",
      details: { code: ERROR_CODES.VALIDATION_ERROR },
    };
  }

  if (typeof message !== "string") {
    return {
      isValid: false,
      error: "Message must be a string",
      details: { code: ERROR_CODES.VALIDATION_ERROR, type: typeof message },
    };
  }

  if (message.trim().length === 0) {
    return {
      isValid: false,
      error: "Message cannot be empty",
      details: { code: ERROR_CODES.VALIDATION_ERROR },
    };
  }

  if (message.length > MESSAGE_LIMITS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Message too long (max ${MESSAGE_LIMITS.MAX_LENGTH} characters)`,
      details: {
        code: ERROR_CODES.VALIDATION_ERROR,
        length: message.length,
        maxLength: MESSAGE_LIMITS.MAX_LENGTH,
      },
    };
  }

  return { isValid: true };
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: any): ValidationResult {
  if (!sessionId) {
    return { isValid: true }; // Session ID is optional
  }

  if (typeof sessionId !== "string") {
    return {
      isValid: false,
      error: "Session ID must be a string",
      details: { code: ERROR_CODES.VALIDATION_ERROR, type: typeof sessionId },
    };
  }

  // UUID v4 format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return {
      isValid: false,
      error: "Invalid session ID format",
      details: { code: ERROR_CODES.VALIDATION_ERROR, sessionId },
    };
  }

  return { isValid: true };
}

/**
 * Validate WebSocket message structure
 */
export function validateWebSocketMessage(message: any): ValidationResult {
  if (!message || typeof message !== "object") {
    return {
      isValid: false,
      error: "Message must be an object",
      details: { code: ERROR_CODES.INVALID_MESSAGE_FORMAT },
    };
  }

  if (!message.type || typeof message.type !== "string") {
    return {
      isValid: false,
      error: "Message type is required and must be a string",
      details: { code: ERROR_CODES.INVALID_MESSAGE_FORMAT },
    };
  }

  // Validate known message types
  const validTypes = [
    WS_MESSAGE_TYPES.CHAT_MESSAGE,
    WS_MESSAGE_TYPES.FUNCTION_RESULT,
  ];
  if (!validTypes.includes(message.type)) {
    return {
      isValid: false,
      error: `Unknown message type: ${message.type}`,
      details: {
        code: ERROR_CODES.INVALID_MESSAGE_FORMAT,
        validTypes,
      },
    };
  }

  return { isValid: true };
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(): ValidationResult {
  const requiredEnvVars = ["ANTHROPIC_API_KEY", "PORT", "NODE_ENV"];

  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      error: "Missing required environment variables",
      details: { missing },
    };
  }

  // Validate PORT is a number
  const port = Number(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      isValid: false,
      error: "PORT must be a valid port number (1-65535)",
      details: { port: process.env.PORT },
    };
  }

  return { isValid: true };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, MESSAGE_LIMITS.MAX_LENGTH); // Limit length
}

/**
 * Validate and sanitize chat message payload
 */
export function validateAndSanitizeChatPayload(payload: any): {
  isValid: boolean;
  sanitizedPayload?: { message: string; sessionId?: string };
  error?: string;
} {
  if (!payload || typeof payload !== "object") {
    return {
      isValid: false,
      error: "Payload must be an object",
    };
  }

  // Validate message
  const messageValidation = validateChatMessage(payload.message);
  if (!messageValidation.isValid) {
    return {
      isValid: false,
      error: messageValidation.error,
    };
  }

  // Validate session ID if provided
  const sessionValidation = validateSessionId(payload.sessionId);
  if (!sessionValidation.isValid) {
    return {
      isValid: false,
      error: sessionValidation.error,
    };
  }

  // Sanitize and return
  const sanitizedPayload: { message: string; sessionId?: string } = {
    message: sanitizeInput(payload.message),
  };

  if (payload.sessionId) {
    sanitizedPayload.sessionId = payload.sessionId;
  }

  return {
    isValid: true,
    sanitizedPayload,
  };
}
