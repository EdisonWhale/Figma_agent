/**
 * WebSocket Controller
 * Handles WebSocket connection management and message routing
 */
import { WebSocketServer, WebSocket, RawData } from "ws";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@utils/logger";
import { WebSocketService } from "@services/websocket.service";
import { SessionService } from "@services/session.service";
import { MCPService } from "@services/mcp.service";
import { validateOrigin } from "@utils/websocket.utils";
import { WEBSOCKET_CONFIG } from "@constants/index";

export class WebSocketController {
  private wsService: WebSocketService;
  private sessionService: SessionService;
  private mcpService: MCPService;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(mcpService: MCPService) {
    this.mcpService = mcpService;
    this.wsService = new WebSocketService(mcpService);
    this.sessionService = new SessionService();
  }

  /**
   * Initialize WebSocket server with event handlers
   */
  public setupWebSocketServer(wss: WebSocketServer): void {
    logger.info({}, "[WebSocket] Server starting");

    this.setupHeartbeat(wss);

    wss.on("connection", (ws: WebSocket, request) => {
      this.handleConnection(ws, request);
    });

    wss.on("error", (error) => {
      logger.error({ error }, "[WebSocket] Server error");
    });

    logger.info({}, "[WebSocket] Server setup completed");
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const origin = request.headers.origin;

    if (!validateOrigin(origin)) {
      logger.warn(
        { origin },
        "[WebSocket] Connection rejected: Invalid origin"
      );
      ws.close(1008, "Invalid origin");
      return;
    }

    const clientId = uuidv4();
    logger.info({ clientId, origin }, "[WebSocket] New connection established");

    // Register client with WebSocket service
    this.wsService.registerClient(clientId, ws);

    // Send connection confirmation
    this.wsService.sendConnectionEstablished(clientId);

    // Setup message handler
    ws.on("message", (data) => {
      this.handleMessage(clientId, data);
    });

    // Setup pong handler for heartbeat
    ws.on("pong", () => {
      const client = this.wsService.getClient(clientId);
      if (client) {
        client.isAlive = true;
        logger.trace({ clientId }, "[WebSocket] Pong received");
      }
    });

    // Setup close handler
    ws.on("close", (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    // Setup error handler
    ws.on("error", (error) => {
      this.handleError(clientId, error);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(clientId: string, data: RawData): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(
        { clientId, messageType: message.type },
        "[WebSocket] Message received"
      );

      await this.wsService.handleMessage(clientId, message);
    } catch (error) {
      logger.error({ clientId, error }, "[WebSocket] Message handling error");
      this.wsService.sendError(clientId, "Invalid message format");
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(
    clientId: string,
    code: number,
    reason: Buffer
  ): void {
    logger.info(
      { clientId, code, reason: reason.toString() },
      "[WebSocket] Client disconnected"
    );
    this.wsService.unregisterClient(clientId);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(clientId: string, error: Error): void {
    logger.error({ clientId, error }, "[WebSocket] Client error");
    this.wsService.sendError(clientId, "Connection error occurred");
  }

  /**
   * Setup heartbeat mechanism
   */
  private setupHeartbeat(wss: WebSocketServer): void {
    this.heartbeatInterval = setInterval(() => {
      this.wsService.performHeartbeat();
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);

    wss.on("close", () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      logger.info({}, "[WebSocket] Server closing, heartbeat stopped");
    });
  }
}
