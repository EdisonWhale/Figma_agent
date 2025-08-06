/**
 * Figma API Service
 * Handles communication between plugin UI and Figma main thread
 * Separated from WebSocket concerns for better architecture
 */

export interface FigmaAPICall {
  type: "FIGMA_API_CALL";
  id: string;
  action: string;
  data: any;
}

export interface FigmaAPIResponse {
  type: "FIGMA_API_RESPONSE";
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface ToolCallInfo {
  toolName: string;
  toolId: string;
  arguments: Record<string, any>;
  result?: string;
  isError?: boolean;
}

/**
 * Service for handling Figma API interactions
 * Provides clean separation between WebSocket communication and Figma API calls
 */
export class FigmaAPIService {
  private pendingCalls = new Map<string, (response: FigmaAPIResponse) => void>();

  constructor() {
    // Listen for responses from main thread
    window.addEventListener("message", this.handleMainThreadMessage.bind(this));
    console.log("[FigmaAPIService] Initialized");
  }

  /**
   * Send tool call to Figma main thread
   */
  async sendToolCall(toolCall: ToolCallInfo): Promise<FigmaAPIResponse> {
    console.log(`[FigmaAPIService] Sending tool call: ${toolCall.toolName}`, toolCall.arguments);
    
    return new Promise((resolve) => {
      // Store resolver for this call
      this.pendingCalls.set(toolCall.toolId, resolve);
      
      // Send to main thread
      parent.postMessage(
        {
          pluginMessage: {
            type: "FIGMA_API_CALL",
            id: toolCall.toolId,
            action: toolCall.toolName,
            data: toolCall.arguments,
          },
        },
        "*"
      );
    });
  }

  /**
   * Send generic Figma API call
   */
  async sendAPICall(action: string, toolId: string, data: any): Promise<FigmaAPIResponse> {
    console.log(`[FigmaAPIService] Sending API call: ${action}`, data);
    
    return new Promise((resolve) => {
      // Store resolver for this call
      this.pendingCalls.set(toolId, resolve);
      
      // Send to main thread
      parent.postMessage(
        {
          pluginMessage: {
            type: "FIGMA_API_CALL",
            id: toolId,
            action: action,
            data: data,
          },
        },
        "*"
      );
    });
  }

  /**
   * Handle responses from main thread
   */
  private handleMainThreadMessage(event: MessageEvent): void {
    const { data } = event;
    
    if (data?.pluginMessage?.type === "FIGMA_API_RESPONSE") {
      const response = data.pluginMessage as FigmaAPIResponse;
      const resolver = this.pendingCalls.get(response.id);
      
      if (resolver) {
        console.log(`[FigmaAPIService] Received response for ${response.id}:`, response);
        resolver(response);
        this.pendingCalls.delete(response.id);
      }
    }
  }

  /**
   * Cleanup pending calls
   */
  cleanup(): void {
    this.pendingCalls.clear();
    window.removeEventListener("message", this.handleMainThreadMessage.bind(this));
    console.log("[FigmaAPIService] Cleaned up");
  }
}