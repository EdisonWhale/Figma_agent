/**
 * WebSocket Service
 * Business logic for WebSocket operations
 */
import { WebSocket } from "ws";
import { logger } from "@utils/logger";
import { ChatService } from "./chat.service";
import { SessionService } from "./session.service";
import { MCPService } from "./mcp.service";
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
  private mcpService: MCPService;
  private recentRequests = new Map<string, { message: string; timestamp: number }>(); // Deduplication

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
    this.chatService = new ChatService(mcpService);
    this.sessionService = new SessionService();
    
    // Register session service with MCP service for special ID resolution
    this.mcpService.setSessionService(this.sessionService);
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
   * Get a WebSocket client by ID
   */
  public getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
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
        case WS_MESSAGE_TYPES.TOOL_RESULT:
          await measureAsync(
            () => this.handleToolResult(clientId, message.payload),
            "WebSocket.handleToolResult",
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
   * Check for duplicate requests within a short time window
   */
  private isDuplicateRequest(clientId: string, message: string): boolean {
    const requestKey = `${clientId}-${message.trim()}`;
    const now = Date.now();
    const existing = this.recentRequests.get(requestKey);
    
    if (existing && (now - existing.timestamp < 2000)) { // 2 second dedup window
      logger.warn(
        { clientId, messageLength: message.length },
        "[WebSocket] Duplicate request detected, ignoring"
      );
      return true;
    }
    
    // Store this request
    this.recentRequests.set(requestKey, { message, timestamp: now });
    
    // Cleanup old requests (prevent memory leaks)
    if (this.recentRequests.size > 100) {
      const cutoff = now - 10000; // 10 seconds
      for (const [key, value] of this.recentRequests.entries()) {
        if (value.timestamp < cutoff) {
          this.recentRequests.delete(key);
        }
      }
    }
    
    return false;
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

      // Check for duplicate requests to prevent race conditions
      if (this.isDuplicateRequest(clientId, sanitizedPayload.message)) {
        return; // Silently ignore duplicate request
      }

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
          onToolCall: (toolCall) => {
            logger.info(
              { clientId, toolName: toolCall.toolName },
              "[WebSocket] Tool call executed"
            );
            
            // Track created elements in session for context awareness
            if (!toolCall.isError && toolCall.toolName.startsWith('create_')) {
              try {
                // Parse the result to extract element ID
                let elementId: string | null = null;
                
                // For create tool calls, try to extract element ID from result
                if (toolCall.result && typeof toolCall.result === 'string') {
                  // Look for patterns like "Created sticky note: ID" or "stickyId: ..."
                  const idMatch = toolCall.result.match(/(?:ID[:\s]+|id[:\s]+|elementId[:\s]+)([A-Za-z0-9_:-]+)/i);
                  if (idMatch) {
                    elementId = idMatch[1];
                  }
                }
                
                if (elementId) {
                  const elementType = toolCall.toolName.replace('create_', '');
                  const createdElement = {
                    id: elementId,
                    type: elementType,
                    text: toolCall.arguments?.text || undefined,
                    color: toolCall.arguments?.color || undefined,
                    x: toolCall.arguments?.x || undefined,
                    y: toolCall.arguments?.y || undefined,
                    toolCall: toolCall.toolName,
                  };
                  
                  // Use non-blocking async call to prevent callback blocking
                  this.sessionService.addCreatedElement(sessionId, createdElement).catch(error => {
                    logger.warn({ error, sessionId, elementId }, "[WebSocket] Failed to save element to session");
                  });
                  
                  logger.info(
                    { sessionId, elementId, toolName: toolCall.toolName },
                    "[WebSocket] Created element tracked in session"
                  );
                }
              } catch (error) {
                logger.warn(
                  { error, toolCall: toolCall.toolName },
                  "[WebSocket] Failed to track created element"
                );
              }
            }
            
            this.sendMessage(clientId, {
              type: WS_MESSAGE_TYPES.TOOL_CALL,
              payload: {
                toolName: toolCall.toolName,
                toolId: toolCall.toolId,
                arguments: toolCall.arguments,
                result: toolCall.result,
                isError: toolCall.isError,
              },
            });
          },
        },
        sessionId // Pass session ID for special ID resolution
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
   * Handle tool result from frontend
   */
  private async handleToolResult(
    clientId: string,
    payload: {
      toolName: string;
      toolId: string;
      result: any;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.sessionId) {
        logger.warn({ clientId }, "[WebSocket] Tool result from client without session");
        return;
      }

      logger.info(
        { clientId, toolName: payload.toolName, success: payload.success },
        "[WebSocket] Received tool result from frontend"
      );

      // Track created elements in session for context awareness
      if (payload.success && payload.toolName.startsWith('create_') && payload.result) {
        try {
          const elementId = payload.result.elementId || payload.result.stickyId;
          
          if (elementId) {
            const elementType = payload.result.type || payload.toolName.replace('create_', '').toUpperCase();
            const createdElement = {
              id: elementId,
              type: elementType,
              text: payload.result.text || undefined,
              color: payload.result.color || undefined,
              x: payload.result.x || undefined,
              y: payload.result.y || undefined,
              toolCall: payload.toolName,
            };
            
            await this.sessionService.addCreatedElement(client.sessionId, createdElement);
            
            logger.info(
              { sessionId: client.sessionId, elementId, toolName: payload.toolName },
              "[WebSocket] Created element tracked in session from frontend"
            );
          }
        } catch (error) {
          logger.warn(
            { error, toolCall: payload.toolName },
            "[WebSocket] Failed to track created element from frontend"
          );
        }
      }

      // Record metrics
      MetricsCollector.recordMetric("websocket.tool_result.processed", 1);
    } catch (error) {
      MetricsCollector.recordMetric("websocket.tool_result.errors", 1);
      logger.error({ error, clientId }, "[WebSocket] Error handling tool result");
    }
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
