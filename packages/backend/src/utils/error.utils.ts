/**
 * Error Handling Utilities
 * Centralized error handling and formatting
 */
import { logger } from "./logger";
import { ERROR_CODES, HTTP_STATUS } from "@constants/index";

// Custom Error Classes
export class ValidationError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = "ValidationError";
    this.code = ERROR_CODES.VALIDATION_ERROR;
    this.details = details;
  }
}

export class SessionError extends Error {
  public readonly code: string;
  public readonly sessionId?: string;

  constructor(message: string, sessionId?: string) {
    super(message);
    this.name = "SessionError";
    this.code = ERROR_CODES.SESSION_NOT_FOUND;
    this.sessionId = sessionId;
  }
}

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "AIServiceError";
    this.code = ERROR_CODES.AI_SERVICE_ERROR;
    this.originalError = originalError;
  }
}

export class WebSocketError extends Error {
  public readonly code: string;
  public readonly clientId?: string;

  constructor(message: string, clientId?: string) {
    super(message);
    this.name = "WebSocketError";
    this.code = ERROR_CODES.WEBSOCKET_ERROR;
    this.clientId = clientId;
  }
}

// Error Response Formatter
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

export function formatErrorResponse(
  error: Error,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): { statusCode: number; response: ErrorResponse } {
  let code: string = ERROR_CODES.WEBSOCKET_ERROR;
  let details: Record<string, any> | undefined;

  // Extract specific error information
  if (error instanceof ValidationError) {
    code = error.code;
    details = error.details;
    statusCode = HTTP_STATUS.BAD_REQUEST;
  } else if (error instanceof SessionError) {
    code = error.code;
    details = { sessionId: error.sessionId };
    statusCode = HTTP_STATUS.NOT_FOUND;
  } else if (error instanceof AIServiceError) {
    code = error.code;
    details = { originalError: error.originalError?.message };
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  } else if (error instanceof WebSocketError) {
    code = error.code;
    details = { clientId: error.clientId };
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  const response: ErrorResponse = {
    error: error.message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };

  return { statusCode, response };
}

// Safe Error Logger
export function logError(
  error: Error,
  context: string,
  additionalInfo?: Record<string, any>
): void {
  const errorInfo: any = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    ...additionalInfo,
  };

  // Add specific error information
  if (error instanceof ValidationError) {
    errorInfo.validationDetails = error.details;
  } else if (error instanceof SessionError) {
    errorInfo.sessionId = error.sessionId;
  } else if (error instanceof AIServiceError) {
    errorInfo.originalError = error.originalError?.message;
  } else if (error instanceof WebSocketError) {
    errorInfo.clientId = error.clientId;
  }

  logger.error(errorInfo, `[${context}] Error occurred`);
}

// Safe Async Error Handler
export function handleAsyncError<T>(
  promise: Promise<T>,
  context: string
): Promise<T | null> {
  return promise.catch((error) => {
    logError(error, context);
    return null;
  });
}

// Retry Mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context: string = "Operation"
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        logError(lastError, context, {
          attempt,
          maxRetries,
          finalAttempt: true,
        });
        throw lastError;
      }

      logger.warn(
        {
          error: lastError.message,
          attempt,
          maxRetries,
          nextRetryIn: delay,
        },
        `[${context}] Retry attempt ${attempt} failed, retrying in ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError!;
}

// Input Sanitization
export function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information patterns
  return message
    .replace(/api[_-]?key[s]?[:\s=]+[^\s]+/gi, "api_key=***")
    .replace(/token[s]?[:\s=]+[^\s]+/gi, "token=***")
    .replace(/password[s]?[:\s=]+[^\s]+/gi, "password=***")
    .replace(/secret[s]?[:\s=]+[^\s]+/gi, "secret=***");
}
