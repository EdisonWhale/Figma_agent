import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@utils/logger"; // Use path alias
import {
  WebSocketClient,
  clients,
  isChatMessageRequest,
  sendMessage,
  sendError,
  setupHeartbeat,
  validateOrigin,
  ErrorCode,
} from "./websocketUtils"; // Import from utils
import { handleChatMessage } from "./websocketHandlers"; // Import handlers
import { getOrCreateSession } from "./session"; // Import session functions

/**
 * Initializes and sets up the WebSocket server and its event listeners.
 */
export function setupWebSocketServer(wss: WebSocketServer) {
  // INFO: Server initialization
  logger.info({}, "[WebSocket] Server starting");

  setupHeartbeat(wss); // Initialize heartbeat mechanism

  wss.on("connection", (ws: WebSocket, req) => {
    const client = ws as WebSocketClient;
    client.clientId = uuidv4();
    client.isAlive = true;

    // Validate connection origin
    const origin = req.headers.origin;
    if (!validateOrigin(origin)) {
      // WARN: Rejected connection is notable
      logger.warn(
        { clientId: client.clientId, origin },
        "[WebSocket] Connection rejected: Invalid origin"
      );
      client.terminate();
      return;
    }

    // Store client and log connection - INFO for successful connection
    clients.set(client.clientId, client);
    logger.info({ clientId: client.clientId }, "[WebSocket] Client connected");

    // Send connection confirmation - DEBUG level
    sendMessage(client, {
      type: "connection_established",
      payload: { clientId: client.clientId, message: "Connection successful." },
    });

    // Setup pong listener for heartbeat
    client.on("pong", () => {
      client.isAlive = true;
      // logger.trace({ clientId: client.clientId }, "[WebSocket] Pong received"); // Keep pong logs at trace if needed
    });

    // Handle incoming messages
    client.on("message", async (rawMessage: Buffer) => {
      let message: unknown;
      let messageType: string | undefined; // To store message type for logging context
      try {
        const messageString = rawMessage.toString();
        // Basic protection against excessively large messages
        if (messageString.length > 10000) {
          // WARN: Large message might be abuse or error
          logger.warn(
            { clientId: client.clientId, size: messageString.length },
            "[WebSocket] Message too large"
          );
          sendError(client, "Message size exceeds limit.", "BAD_REQUEST"); // WARN log
          return;
        }

        message = JSON.parse(messageString);
        messageType = (message as any)?.type; // Get type for context

        // DEBUG: Log receipt of any message with its type
        logger.debug(
          { clientId: client.clientId, messageType },
          "[WebSocket] Received message"
        );

        // --- Message Routing ---
        if (isChatMessageRequest(message)) {
          // Ensure session is associated before handling chat
          if (!client.sessionId) {
            const { sessionId, isNewSession } = getOrCreateSession(
              message.payload.sessionId
            );
            client.sessionId = sessionId;
            // INFO: Only log when a *new* session is created and associated
            if (isNewSession) {
              logger.info(
                { clientId: client.clientId, sessionId },
                "[WebSocket] New session associated"
              );
            } else {
              // DEBUG: Log when an existing session is re-associated (e.g., reconnect)
              logger.debug(
                { clientId: client.clientId, sessionId },
                "[WebSocket] Existing session associated"
              );
            }
            sendMessage(client, {
              type: "session_update",
              payload: { sessionId },
            }); // DEBUG log
          }
          // Delegate to handler (session ID is now guaranteed on client object)
          await handleChatMessage(client, client.sessionId, message); // Handlers log key events at INFO
        } else {
          // WARN: Unknown message type might indicate client/server version mismatch or bad client
          logger.warn(
            { clientId: client.clientId, messageType },
            "[WebSocket] Received unknown message type"
          );
          sendError(
            client,
            "Unknown message type or invalid format.",
            "BAD_REQUEST"
          ); // WARN log
        }
      } catch (err) {
        // ERROR: Unhandled processing errors are critical
        const error = err instanceof Error ? err : new Error(String(err)); // Ensure it's an Error object
        let errorCode: ErrorCode = "INTERNAL_ERROR";
        let errorMessage = "Failed to process message.";
        if (error instanceof SyntaxError) {
          errorCode = "BAD_REQUEST";
          errorMessage = "Invalid JSON format.";
        } else {
          // Keep original message for other errors
          errorMessage = error.message;
        }
        // Log the error object itself along with context
        logger.error(error, "[WebSocket] Error processing message", {
          clientId: client.clientId,
          messageType,
        });
        sendError(client, errorMessage, errorCode); // WARN log
      }
    });

    // Handle client disconnection
    client.on("close", (code, reason) => {
      // INFO: Disconnection is a standard event
      logger.info(
        { clientId: client.clientId, code, reason: reason.toString() || "N/A" },
        "[WebSocket] Client disconnected"
      );
      clients.delete(client.clientId); // Remove client from map
    });

    // Handle client errors
    client.on("error", (err) => {
      // ERROR: WebSocket-level errors are critical
      logger.error(err, "[WebSocket] Client connection error", {
        clientId: client.clientId,
      });
      // Ensure client is removed if error causes disconnection state
      if (
        client.readyState !== WebSocket.OPEN &&
        client.readyState !== WebSocket.CONNECTING
      ) {
        clients.delete(client.clientId);
      }
    });
  });

  logger.info({}, "[WebSocket] Server ready");
}
