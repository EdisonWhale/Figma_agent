/**
 * Common Validation Utilities
 * Shared validation functions between frontend and backend
 */
import { MessageRole, MessageValidation } from "../types/chat.types";
import { MESSAGE_ROLES, ERROR_CODES } from "../constants";

/**
 * Validate message role
 */
export function validateMessageRole(role: any): role is MessageRole {
  return Object.values(MESSAGE_ROLES).includes(role);
}

/**
 * Validate message content
 */
export function validateMessageContent(content: any): MessageValidation {
  if (content === null || content === undefined) {
    return {
      isValid: false,
      error: "Message content cannot be null or undefined",
      details: { code: ERROR_CODES.VALIDATION_ERROR },
    };
  }

  if (typeof content !== "string") {
    return {
      isValid: false,
      error: "Message content must be a string",
      details: {
        code: ERROR_CODES.VALIDATION_ERROR,
        type: typeof content,
      },
    };
  }

  if (content.trim().length === 0) {
    return {
      isValid: false,
      error: "Message content cannot be empty",
      details: { code: ERROR_CODES.VALIDATION_ERROR },
    };
  }

  return { isValid: true };
}

/**
 * Validate session ID format (UUID v4)
 */
export function validateSessionId(sessionId: any): MessageValidation {
  if (!sessionId) {
    return { isValid: true }; // Session ID is optional
  }

  if (typeof sessionId !== "string") {
    return {
      isValid: false,
      error: "Session ID must be a string",
      details: {
        code: ERROR_CODES.VALIDATION_ERROR,
        type: typeof sessionId,
      },
    };
  }

  // UUID v4 format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return {
      isValid: false,
      error: "Invalid session ID format (must be UUID v4)",
      details: {
        code: ERROR_CODES.VALIDATION_ERROR,
        sessionId,
      },
    };
  }

  return { isValid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(
  input: string,
  maxLength: number = 10000
): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, maxLength); // Limit length
}
