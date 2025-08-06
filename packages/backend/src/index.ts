import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { PORT, NODE_ENV } from "./config";
import { corsMiddleware } from "./middleware/cors";
import routes from "./routes";
import { WebSocketController } from "./controllers/websocket.controller";
import { MCPService } from "./services/mcp.service";
import { logger } from "./utils/logger";
import { validateEnvironmentConfig } from "./utils/validation.utils";
import { HTTP_STATUS } from "./constants";
import { MemoryMonitor } from "./utils/performance.utils";

// Validate environment configuration on startup
const envValidation = validateEnvironmentConfig();
if (!envValidation.isValid) {
  logger.error(
    { error: envValidation.error, details: envValidation.details },
    "Environment configuration validation failed"
  );
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize MCP service
const mcpService = new MCPService();

// Initialize WebSocket controller with MCP service
const wsController = new WebSocketController(mcpService);
wsController.setupWebSocketServer(wss);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(corsMiddleware);

// Routes
app.use(routes);

// Global HTTP error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(
      { error: err.message, stack: err.stack },
      "Unhandled error in HTTP request handler"
    );
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
    });
  }
);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info({}, "SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info({}, "Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info({}, "SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info({}, "Server closed");
    process.exit(0);
  });
});

// Initialize MCP service and start server
async function startServer() {
  try {
    // Initialize MCP service
    logger.info({}, "[MCP] Initializing MCP service...");
    await mcpService.initialize();
    logger.info({}, "[MCP] MCP service initialized successfully");
  } catch (error) {
    logger.error({ error }, "[MCP] Failed to initialize MCP service");
    logger.warn({}, "[MCP] Server will start without MCP functionality");
  }

  // Start server
  server.listen(PORT, () => {
    logger.info(
      { environment: NODE_ENV, port: PORT },
      "Server started successfully"
    );
    logger.info({}, `HTTP server listening on http://localhost:${PORT}`);
    logger.info({}, `WebSocket server ready on ws://localhost:${PORT}`);

    // Start memory monitoring in production
    if (NODE_ENV === "production") {
      MemoryMonitor.getInstance().startMonitoring(60000); // Every minute
      logger.info({}, "Memory monitoring started");
    }
  });
}

startServer();
