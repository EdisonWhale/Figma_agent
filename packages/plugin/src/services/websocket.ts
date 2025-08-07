/**
 * WebSocket Service
 * Handles connection and communication with the backend WebSocket server.
 * Integrated with FigmaAPIService and enhanced error handling.
 */
import { config } from "../config";
import { ConnectionStatus, PluginErrorFactory, PluginErrorManager, PluginError, type ErrorRecoveryStrategy } from "../types/index";
import { FigmaAPIService, type ToolCallInfo } from "./figmaAPI";

// Define the structure of callbacks the UI hook will provide
export interface WebSocketCallbacks {
  onMessage: (message: string) => void; // For general messages/errors from this service
  onStatusChange: (status: ConnectionStatus) => void;
  onFunctionCall: () => void; // Placeholder for disabled function calling
  onChunk: (chunk: string) => void; // For text chunks
  onStreamEnd: (responseId: string) => void; // Stream finished successfully
  onToolCall?: (toolCall: ToolCallInfo) => void; // For MCP tool calls
  onError?: (error: PluginError) => void; // Enhanced error handling
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null; // Store session ID received from backend
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false; // Flag to prevent reconnect on manual close
  
  // Enhanced services integration
  private figmaAPIService: FigmaAPIService;
  private errorManager: PluginErrorManager;

  constructor(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
    
    // Initialize services
    this.figmaAPIService = new FigmaAPIService();
    this.errorManager = new PluginErrorManager({
      onError: (error: PluginError) => {
        this.callbacks.onError?.(error);
        console.error("[WebSocketService] Error handled:", error);
      },
      onRecovery: (error: PluginError, strategy: ErrorRecoveryStrategy) => {
        console.log(`[WebSocketService] Attempting recovery for ${error.type} error:`, strategy.label);
      },
      onRecoverySuccess: (error: PluginError) => {
        console.log(`[WebSocketService] Recovery successful for ${error.type} error`);
      },
      onRecoveryFailure: (error: PluginError, reason: string) => {
        console.error(`[WebSocketService] Recovery failed for ${error.type} error:`, reason);
      }
    });
    
    console.log("[WebSocketService] Initialized with enhanced services");
  }

  connect(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log("[WebSocketService] Already connected or connecting.");
      return; // Avoid multiple connections
    }

    // Clear any pending reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isManualClose = false;
    this.callbacks.onStatusChange("connecting");
    console.log("[WebSocketService] Connecting to:", config.wsBaseUrl);

    try {
      this.ws = new WebSocket(config.wsBaseUrl);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Note: Browser WebSocket API doesn't expose ping/pong events
      // The browser automatically handles pong responses to server pings
    } catch (error) {
      const pluginError = PluginErrorFactory.websocket(
        'connection_failed',
        error instanceof Error ? error.message : 'Unknown connection error',
        () => this.connect()
      );
      this.errorManager.handleError(pluginError);
      this.callbacks.onStatusChange("error");
      this.attemptReconnect(); // Attempt reconnect on initial connection error
    }
  }

  disconnect(): void {
    console.log("[WebSocketService] Manual disconnect requested.");
    this.isManualClose = true; // Set flag *before* closing
    
    // Clean up services
    this.figmaAPIService.cleanup();
    this.errorManager.clearAllErrors();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Explicitly set status, handleClose might not fire reliably on manual close
    this.callbacks.onStatusChange("disconnected");
  }

  sendMessage(message: string): void {
    if (!this.ensureConnection()) {
      const connectionError = PluginErrorFactory.connection(
        "Cannot send message: Not connected",
        { operation: 'sendMessage' },
        () => this.connect()
      );
      this.errorManager.handleError(connectionError);
      
      // Optionally trigger connect attempt if disconnected
      if (
        this.ws?.readyState === WebSocket.CLOSED ||
        this.ws?.readyState === WebSocket.CLOSING
      ) {
        this.connect();
      }
      return;
    }

    console.log("[WebSocketService] Sending chat message..."); // Avoid logging content
    try {
      this.ws!.send(
        JSON.stringify({
          type: "chat_message",
          payload: { message, sessionId: this.sessionId }, // Include current sessionId
        })
      );
    } catch (error) {
      const sendError = PluginErrorFactory.websocket(
        'send_message',
        error instanceof Error ? error.message : 'Unknown send error',
        () => this.sendMessage(message)
      );
      this.errorManager.handleError(sendError);
      this.callbacks.onStatusChange("error");
    }
  }

  private ensureConnection(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleOpen(): void {
    console.log("[WebSocketService] Connection established.");
    this.reconnectAttempts = 0; // Reset on successful connection
    this.callbacks.onStatusChange("connected");
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Log only non-chunk messages for clarity
      if (data.type !== "stream_chunk") {
        console.log(
          `[WebSocketService] Received message type: ${data.type}`,
          data.payload || ""
        );
      }

      const payload = data.payload || {};

      switch (data.type) {
        case "connection_established":
          console.log(
            `[WebSocketService] Connection confirmed by server. Client ID: ${payload.clientId}`
          );
          // Store session ID if provided on initial connection (though usually comes later)
          if (payload.sessionId) {
            this.sessionId = payload.sessionId;
            console.log(
              `[WebSocketService] Session ID set on connection: ${this.sessionId}`
            );
          }
          break;
        case "session_update":
          if (payload.sessionId) {
            this.sessionId = payload.sessionId;
            console.log(
              `[WebSocketService] Session ID updated: ${this.sessionId}`
            );
          }
          break;
        case "stream_start":
          console.log("[WebSocketService] Stream starting...");
          // Ensure session ID is captured if sent with start event
          if (payload.sessionId && !this.sessionId) {
            this.sessionId = payload.sessionId;
            console.log(
              `[WebSocketService] Session ID set at stream start: ${this.sessionId}`
            );
          }
          break;
        case "stream_chunk":
          if (payload.text !== undefined) {
            this.callbacks.onChunk(payload.text);
          }
          if (payload.functionCall) {
            console.log("[WebSocketService] Function calling is disabled");
            this.callbacks.onFunctionCall(); // Function calling disabled
          }
          break;
        case "tool_call":
          console.log("[WebSocketService] Tool call received:", payload);
          const toolCall: ToolCallInfo = {
            toolName: payload.toolName,
            toolId: payload.toolId,
            arguments: payload.arguments,
            result: payload.result,
            isError: payload.isError || false,
          };
          
          if (this.callbacks.onToolCall) {
            this.callbacks.onToolCall(toolCall);
          }
          
          // Handle ALL Figma API calls through FigmaAPIService
          // All MCP tools are supported by the main thread
          
          // List of supported MCP tools for validation
          const SUPPORTED_TOOLS = [
            // Page information tools
            'get_current_page_info', 'query_elements', 'get_element_details', 'get_page_statistics',
            // Element creation tools
            'create_sticky_note', 'create_rectangle', 'create_ellipse', 'create_text', 'create_connector',
            // Element management tools
            'update_element', 'delete_element', 'delete_elements', 'select_elements', 'duplicate_element', 'arrange_elements'
          ];
          
          if (!SUPPORTED_TOOLS.includes(payload.toolName)) {
            console.warn(`[WebSocketService] Unsupported tool call: ${payload.toolName}`);
            const unsupportedError = PluginErrorFactory.figmaAPI(
              payload.toolName,
              `Tool '${payload.toolName}' is not supported by the Figma plugin`,
              { toolCall, supportedTools: SUPPORTED_TOOLS }
            );
            this.errorManager.handleError(unsupportedError);
            break;
          }
          
          console.log(
            `[WebSocketService] Processing supported tool call: ${payload.toolName}`,
            {
              toolId: payload.toolId,
              hasArguments: !!payload.arguments,
              argumentKeys: payload.arguments ? Object.keys(payload.arguments) : [],
              isQuery: payload.toolName.startsWith('get_') || payload.toolName.includes('query'),
              isModification: ['update_element', 'delete_element', 'delete_elements'].includes(payload.toolName),
              isCreation: payload.toolName.startsWith('create_')
            }
          );
          
          try {
            // Send all tool calls to FigmaAPIService (main thread handles all tools)
            this.figmaAPIService.sendToolCall(toolCall)
              .then((figmaResponse) => {
                console.log(`[WebSocketService] Successfully processed ${payload.toolName}`, figmaResponse);
                
                // Send the actual Figma response data back to backend via WebSocket
                // This ensures AI gets the real data instead of just "success" message
                if (figmaResponse.success && figmaResponse.result) {
                  console.log(`[WebSocketService] Sending tool result to backend:`, {
                    toolName: payload.toolName,
                    toolId: payload.toolId,
                    hasResult: true,
                    resultKeys: Object.keys(figmaResponse.result || {})
                  });
                  
                  // Send the actual tool result data to backend
                  this.sendMessage(JSON.stringify({
                    type: "tool_result",
                    payload: {
                      toolName: payload.toolName,
                      toolId: payload.toolId,
                      result: figmaResponse.result,
                      success: true
                    }
                  }));
                } else {
                  console.warn(`[WebSocketService] Tool ${payload.toolName} completed but without result data`);
                }
              })
              .catch((error) => {
                console.error(`[WebSocketService] Failed to process ${payload.toolName}:`, error);
                const figmaError = PluginErrorFactory.figmaAPI(
                  payload.toolName,
                  error instanceof Error ? error.message : 'Unknown Figma API error',
                  { toolCall }
                );
                this.errorManager.handleError(figmaError);
                
                // Send error result to backend
                this.sendMessage(JSON.stringify({
                  type: "tool_result",
                  payload: {
                    toolName: payload.toolName,
                    toolId: payload.toolId,
                    result: null,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                }));
              });
          } catch (error) {
            console.error(`[WebSocketService] Failed to process ${payload.toolName}:`, error);
            const figmaError = PluginErrorFactory.figmaAPI(
              payload.toolName,
              error instanceof Error ? error.message : 'Unknown Figma API error',
              { toolCall }
            );
            this.errorManager.handleError(figmaError);
          }
          break;
        case "stream_end":
          console.log(
            `[WebSocketService] Stream ended. Response ID: ${payload.responseId}`
          );
          // Ensure session ID is captured if sent with end event
          if (payload.sessionId && !this.sessionId) {
            this.sessionId = payload.sessionId;
            console.log(
              `[WebSocketService] Session ID set at stream end: ${this.sessionId}`
            );
          }
          this.callbacks.onStreamEnd(payload.responseId || ""); // Pass responseId
          break;
        case "stream_error":
          const streamError = PluginErrorFactory.websocket(
            'stream_error',
            payload.message || 'Unknown stream error'
          );
          this.errorManager.handleError(streamError);
          this.callbacks.onStatusChange("error");
          break;
        case "error": // General error from backend
          const backendError = PluginErrorFactory.api(
            payload.message || 'Unknown backend error',
            payload.code ? parseInt(payload.code) : undefined,
            { code: payload.code }
          );
          this.errorManager.handleError(backendError);
          this.callbacks.onStatusChange("error");
          break;
        default:
          console.warn(
            "[WebSocketService] Received unknown message type:",
            data.type
          );
      }
    } catch (error) {
      const parseError = PluginErrorFactory.websocket(
        'message_parse',
        error instanceof Error ? error.message : 'Failed to parse message',
        () => this.connect()
      );
      parseError.details = { rawData: event.data };
      this.errorManager.handleError(parseError);
      this.callbacks.onStatusChange("error");
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(
      `[WebSocketService] Connection closed. Code: ${event.code}, Reason: ${
        event.reason || "N/A"
      }, Manual: ${this.isManualClose}`
    );
    this.ws = null; // Clear instance

    if (!this.isManualClose) {
      this.callbacks.onStatusChange("disconnected"); // Show disconnected first
      this.attemptReconnect();
    } else {
      this.callbacks.onStatusChange("disconnected"); // Stay disconnected
    }
    // Reset flag after handling close
    // this.isManualClose = false; // No, keep it true until next connect attempt
  }

  private handleError(event: Event): void {
    // This often precedes 'close'. Log it but rely on 'close' for reconnect logic.
    console.error("[WebSocketService] WebSocket error occurred:", event);
    // Only update status if we know we aren't connected/connecting anymore
    if (
      !this.ws ||
      (this.ws.readyState !== WebSocket.OPEN &&
        this.ws.readyState !== WebSocket.CONNECTING)
    ) {
      this.callbacks.onStatusChange("error");
    }
  }

  private attemptReconnect(): void {
    if (this.isManualClose || this.reconnectTimeout !== null) {
      console.log(
        "[WebSocketService] Skipping reconnect attempt (manual close or already scheduled)."
      );
      return;
    }

    if (this.reconnectAttempts >= config.reconnectMaxAttempts) {
      console.log(
        `[WebSocketService] Max reconnect attempts (${config.reconnectMaxAttempts}) reached. Stopping.`
      );
      this.callbacks.onStatusChange("error"); // Stay in error state
      this.callbacks.onMessage(
        "Connection failed. Please try refreshing the plugin later."
      );
      return;
    }

    const delay = Math.min(
      config.reconnectInitialDelay * Math.pow(2, this.reconnectAttempts),
      config.reconnectMaxDelay
    );

    this.reconnectAttempts++;
    console.log(
      `[WebSocketService] Attempting reconnect (${this.reconnectAttempts}/${config.reconnectMaxAttempts}) in ${delay}ms...`
    );
    this.callbacks.onStatusChange("connecting"); // Show connecting during wait

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null; // Clear timeout ID before connecting
      this.connect(); // Attempt connection again
    }, delay);
  }

}
