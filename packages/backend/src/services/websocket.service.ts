/**
 * WebSocket Service
 * Business logic for WebSocket operations
 */
import { WebSocket } from "ws";
import { logger } from "@utils/logger";
import { ChatService } from "./chat.service";
import { SessionService } from "./session.service";
import { WebSocketClient, WSMessage } from "../types/websocket.types";
import { ERROR_CODES, WS_MESSAGE_TYPES } from "@constants/index";
import {
  ValidationError,
  WebSocketError,
  logError,
  handleAsyncError,
} from "@utils/error.utils";
import {
  measureAsync,
  RequestTracker,
  MetricsCollector,
} from "@utils/performance.utils";
import { validateAndSanitizeChatPayload } from "@utils/validation.utils";

export class WebSocketService {
  private clients = new Map<string, WebSocketClient>();
  private chatService: ChatService;
  private sessionService: SessionService;

  constructor() {
    this.chatService = new ChatService();
    this.sessionService = new SessionService();
  }

  /**
   * Register a new WebSocket client
   */
  public registerClient(clientId: string, ws: WebSocket): void {
    const client: WebSocketClient = {
      id: clientId,
      ws,
      isAlive: true,
      sessionId: null,
    };

    this.clients.set(clientId, client);
    logger.info({ clientId }, "[WebSocket] Client registered");
  }

  /**
   * Unregister a WebSocket client
   */
  public unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
    logger.info({ clientId }, "[WebSocket] Client unregistered");
  }

  /**
   * Send connection established message
   */
  public sendConnectionEstablished(clientId: string): void {
    this.sendMessage(clientId, {
      type: WS_MESSAGE_TYPES.CONNECTION_ESTABLISHED,
      payload: { clientId },
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  public async handleMessage(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn({ clientId }, "[WebSocket] Message from unknown client");
      return;
    }

    const requestId = `${clientId}-${Date.now()}`;
    RequestTracker.startRequest(requestId, {
      clientId,
      messageType: message.type,
    });

    try {
      switch (message.type) {
        case WS_MESSAGE_TYPES.CHAT_MESSAGE:
          await measureAsync(
            () => this.handleChatMessage(clientId, message.payload),
            "WebSocket.handleChatMessage",
            { clientId, requestId }
          );
          break;
        default:
          logger.warn(
            { clientId, messageType: message.type },
            "[WebSocket] Unknown message type"
          );
          this.sendError(clientId, "Unknown message type");
      }
    } catch (error) {
      logError(error as Error, "WebSocket.handleMessage", {
        clientId,
        requestId,
        messageType: message.type,
      });
      this.sendError(clientId, "Failed to process message");
    } finally {
      const duration = RequestTracker.endRequest(requestId);
      if (duration) {
        MetricsCollector.recordMetric("websocket.message.duration", duration);
      }
    }
  }

  /**
   * Handle chat message
   */
  private async handleChatMessage(
    clientId: string,
    payload: { message: string; sessionId?: string }
  ): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        throw new WebSocketError("Client not found", clientId);
      }

      // Validate and sanitize payload
      const validation = validateAndSanitizeChatPayload(payload);
      if (!validation.isValid) {
        throw new ValidationError(validation.error || "Invalid payload");
      }

      const sanitizedPayload = validation.sanitizedPayload!;

      // Get or create session
      const { sessionId, sessionData, isNewSession } =
        this.sessionService.getOrCreateSession(sanitizedPayload.sessionId);

      // Update client session
      client.sessionId = sessionId;

      // Send session update if new
      if (isNewSession) {
        this.sendMessage(clientId, {
          type: WS_MESSAGE_TYPES.SESSION_UPDATE,
          payload: { sessionId },
        });
      }

      // Send stream start
      this.sendMessage(clientId, {
        type: WS_MESSAGE_TYPES.STREAM_START,
        payload: { sessionId },
      });

      // Process chat message
      await this.chatService.processMessage(
        sanitizedPayload.message,
        sessionData.chatHistory,
        {
          onChunk: (chunk: string) => {
            this.sendMessage(clientId, {
              type: WS_MESSAGE_TYPES.STREAM_CHUNK,
              payload: { text: chunk },
            });
          },
          onComplete: (finalText: string, responseId: string) => {
            // Update session
            this.sessionService.updateSession(sessionId, responseId, {
              role: "assistant",
              content: finalText,
            });

            // Send stream end
            this.sendMessage(clientId, {
              type: WS_MESSAGE_TYPES.STREAM_END,
              payload: { responseId, sessionId },
            });
          },
          onError: (error: Error) => {
            logger.error(
              { clientId, error },
              "[WebSocket] Chat processing error"
            );
            this.sendMessage(clientId, {
              type: WS_MESSAGE_TYPES.STREAM_ERROR,
              payload: { message: error.message },
            });
          },
        }
      );

      // Add user message to session
      this.sessionService.addMessageToSession(sessionId, {
        role: "user",
        content: sanitizedPayload.message,
      });

      // Record metrics
      MetricsCollector.recordMetric("websocket.chat.processed", 1);
    } catch (error) {
      MetricsCollector.recordMetric("websocket.chat.errors", 1);

      if (error instanceof ValidationError) {
        logger.warn(
          { clientId, error: error.message, details: error.details },
          "[WebSocket] Chat message validation failed"
        );
        this.sendError(clientId, error.message, error.code);
      } else if (error instanceof WebSocketError) {
        logger.error(
          { clientId, error: error.message },
          "[WebSocket] WebSocket error in chat handling"
        );
        this.sendError(clientId, "Connection error", error.code);
      } else {
        logError(error as Error, "WebSocket.handleChatMessage", { clientId });
        this.sendError(clientId, "Failed to process chat message");
      }
    }
  }

  /**
   * Send message to client
   */
  public sendMessage(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      logger.warn(
        { clientId },
        "[WebSocket] Cannot send message: Client not available"
      );
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error({ clientId, error }, "[WebSocket] Failed to send message");
    }
  }

  /**
   * Send error message to client
   */
  public sendError(clientId: string, message: string, code?: string): void {
    this.sendMessage(clientId, {
      type: WS_MESSAGE_TYPES.ERROR,
      payload: {
        code: code || ERROR_CODES.WEBSOCKET_ERROR,
        message,
      },
    });
  }

  /**
   * Perform heartbeat check on all clients
   */
  public performHeartbeat(): void {
    let aliveCount = 0;
    let deadCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (client.isAlive === false) {
          client.ws.terminate();
          this.clients.delete(clientId);
          deadCount++;
          return;
        }

        client.isAlive = false;
        client.ws.ping();
        aliveCount++;
      } else {
        this.clients.delete(clientId);
        deadCount++;
      }
    });

    if (deadCount > 0) {
      logger.debug(
        { aliveCount, deadCount },
        "[WebSocket] Heartbeat completed"
      );
    }
  }
}
