/**
 * WebSocket Utility Functions
 */
import { ALLOWED_ORIGINS } from "@constants/index";
import { logger } from "./logger";

/**
 * Validate WebSocket connection origin
 */
export function validateOrigin(origin: string | undefined): boolean {
  // Allow connections without origin only in development mode
  if (!origin && process.env.NODE_ENV === "development") {
    return true;
  }

  if (!origin) {
    return false;
  }

  const isAllowed = ALLOWED_ORIGINS.includes(origin as any);
  
  if (!isAllowed) {
    logger.warn({ origin }, "[WebSocket] Invalid origin attempted connection");
  }

  return isAllowed;
}

/**
 * Generate WebSocket close code with reason
 */
export function getCloseCodeWithReason(code: number): { code: number; reason: string } {
  const closeReasons: Record<number, string> = {
    1000: "Normal Closure",
    1001: "Going Away",
    1002: "Protocol Error",
    1003: "Unsupported Data",
    1005: "No Status Received",
    1006: "Abnormal Closure",
    1007: "Invalid frame payload data",
    1008: "Policy Violation",
    1009: "Message Too Big",
    1010: "Mandatory Extension",
    1011: "Internal Server Error",
    1015: "TLS Handshake",
  };

  return {
    code,
    reason: closeReasons[code] || "Unknown",
  };
}

/**
 * Check if WebSocket is in a ready state
 */
export function isWebSocketReady(ws: any): boolean {
  return ws && ws.readyState === 1; // WebSocket.OPEN
}

/**
 * Safely send WebSocket message
 */
export function safeSendWebSocketMessage(
  ws: any,
  message: any,
  clientId?: string
): boolean {
  try {
    if (!isWebSocketReady(ws)) {
      logger.warn({ clientId }, "[WebSocket] Attempted to send to non-ready WebSocket");
      return false;
    }

    ws.send(JSON.stringify(message));
    return true;
  } catch (error) {
    logger.error(
      { clientId, error },
      "[WebSocket] Failed to send message"
    );
    return false;
  }
}

/**
 * Parse WebSocket message safely
 */
export function parseWebSocketMessage(data: any): { success: boolean; message?: any; error?: string } {
  try {
    const message = JSON.parse(data.toString());
    return { success: true, message };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown parsing error" 
    };
  }
}

/**
 * Create standardized WebSocket error response
 */
export function createErrorResponse(code: string, message: string, details?: any) {
  return {
    type: "error",
    payload: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create standardized WebSocket success response
 */
export function createSuccessResponse(type: string, payload: any) {
  return {
    type,
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
    },
  };
}
