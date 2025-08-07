/**
 * MCP Service
 * Handles connection and communication with MCP servers
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "@utils/logger";
import path from "path";
import { SessionService } from "./session.service";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
  sessionId?: string; // Optional session ID for special ID resolution
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class MCPService {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private tools: MCPTool[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private sessionService: SessionService | null = null;

  constructor() {
    logger.info({}, "[MCP] Service initialized");
  }

  /**
   * Set session service for special ID resolution
   */
  public setSessionService(sessionService: SessionService): void {
    this.sessionService = sessionService;
    logger.info({}, "[MCP] Session service registered for special ID resolution");
  }

  /**
   * Check if session service is available
   */
  public hasSessionService(): boolean {
    return this.sessionService !== null;
  }

  /**
   * Save created element to session immediately
   */
  public async saveCreatedElement(sessionId: string, element: any): Promise<void> {
    if (this.sessionService) {
      await this.sessionService.addCreatedElement(sessionId, element);
      logger.debug(
        { sessionId, elementId: element.id },
        "[MCP] Element saved to session via direct call"
      );
    }
  }

  /**
   * Connect to MCP server
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info({}, "[MCP] Already connected");
        return;
      }

      logger.info({}, "[MCP] Connecting to MCP server...");

      // Path to the MCP server
      const mcpServerPath = path.resolve(
        __dirname,
        "../../../mcp-server/dist/index.js"
      );

      // Create client
      this.client = new Client(
        {
          name: "figma-backend-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Create transport
      this.transport = new StdioClientTransport({
        command: "node",
        args: [mcpServerPath],
      });

      // Connect
      await this.client.connect(this.transport);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Load available tools
      await this.loadTools();

      logger.info(
        { toolCount: this.tools.length },
        "[MCP] Connected successfully"
      );
    } catch (error) {
      logger.error({ error }, "[MCP] Connection failed");
      this.isConnected = false;

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        logger.info(
          { attempt: this.reconnectAttempts, max: this.maxReconnectAttempts },
          "[MCP] Attempting reconnection..."
        );
        setTimeout(() => this.connect(), 5000);
      } else {
        logger.error({}, "[MCP] Max reconnection attempts reached");
      }
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        this.transport = null;
      }

      this.isConnected = false;
      this.tools = [];

      logger.info({}, "[MCP] Disconnected");
    } catch (error) {
      logger.error({ error }, "[MCP] Disconnect error");
    }
  }

  /**
   * Load available tools from MCP server
   */
  private async loadTools(): Promise<void> {
    if (!this.client) {
      throw new Error("MCP client not connected");
    }

    try {
      // Use listTools method instead of raw request
      const response = await this.client.listTools();

      this.tools = (response as any).tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      logger.info(
        { tools: this.tools.map((t) => t.name) },
        "[MCP] Tools loaded"
      );
    } catch (error) {
      logger.error({ error }, "[MCP] Failed to load tools");
      throw error;
    }
  }

  /**
   * Get available tools
   */
  public getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Check if connected
   */
  public isConnectedToMCP(): boolean {
    return this.isConnected;
  }

  /**
   * Call a tool with special ID resolution
   */
  public async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client || !this.isConnected) {
      throw new Error("MCP client not connected");
    }

    try {
      // Resolve special IDs if sessionId is provided
      const resolvedArguments = await this.resolveSpecialIds(toolCall.arguments, toolCall.sessionId);

      logger.info(
        { 
          toolName: toolCall.name, 
          originalArgs: toolCall.arguments,
          resolvedArgs: resolvedArguments,
          hasSessionId: !!toolCall.sessionId 
        },
        "[MCP] Calling tool"
      );

      const response = await this.client.callTool({
        name: toolCall.name,
        arguments: resolvedArguments,
      });

      logger.info(
        { toolName: toolCall.name, success: true },
        "[MCP] Tool call completed"
      );

      // Enhance response based on tool type
      const enhancedContent = this.enhanceToolResponse(toolCall.name, response);

      return {
        content: enhancedContent,
        isError: false,
      };
    } catch (error) {
      logger.error(
        { toolName: toolCall.name, error },
        "[MCP] Tool call failed"
      );

      return {
        content: [
          {
            type: "text",
            text: `Tool call failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check if a tool exists
   */
  public hasTool(toolName: string): boolean {
    return this.tools.some((tool) => tool.name === toolName);
  }

  /**
   * Get tool by name
   */
  public getTool(toolName: string): MCPTool | undefined {
    return this.tools.find((tool) => tool.name === toolName);
  }

  /**
   * Initialize MCP service (connect and setup)
   */
  public async initialize(): Promise<void> {
    try {
      await this.connect();
      logger.info({}, "[MCP] Service initialized successfully");
    } catch (error) {
      logger.error({ error }, "[MCP] Service initialization failed");
      throw error;
    }
  }

  /**
   * Resolve special IDs to actual element IDs using session data
   */
  private async resolveSpecialIds(
    args: Record<string, any>, 
    sessionId?: string
  ): Promise<Record<string, any>> {
    if (!sessionId || !this.sessionService) {
      return args;
    }

    const resolvedArgs = { ...args };

    // Check for special IDs in elementId parameter
    if (resolvedArgs.elementId && typeof resolvedArgs.elementId === 'string') {
      const specialId = resolvedArgs.elementId;
      let actualId = null;

      switch (specialId) {
        case "LAST_CREATED":
          const lastElement = this.sessionService.getMostRecentElement(sessionId);
          if (lastElement) {
            actualId = lastElement.id;
            logger.info(
              { sessionId, specialId, resolvedId: actualId, elementType: lastElement.type },
              "[MCP] Resolved special ID"
            );
          }
          break;

        case "LAST_STICKY":
          const lastSticky = this.sessionService.getMostRecentElement(sessionId, { type: "sticky" });
          if (lastSticky) {
            actualId = lastSticky.id;
            logger.info(
              { sessionId, specialId, resolvedId: actualId },
              "[MCP] Resolved special ID for sticky note"
            );
          }
          break;

        case "LAST_TEXT":
          const lastText = this.sessionService.getMostRecentElement(sessionId, { type: "text" });
          if (lastText) {
            actualId = lastText.id;
            logger.info(
              { sessionId, specialId, resolvedId: actualId },
              "[MCP] Resolved special ID for text element"
            );
          }
          break;

        default:
          // Not a special ID, keep as is
          break;
      }

      if (actualId) {
        resolvedArgs.elementId = actualId;
      } else if (specialId.startsWith("LAST_")) {
        logger.warn(
          { sessionId, specialId },
          "[MCP] Could not resolve special ID - no matching element found"
        );
        // Keep the special ID to allow graceful error handling by Figma plugin
      }
    }

    return resolvedArgs;
  }

  /**
   * Enhance tool response with better context for AI
   */
  private enhanceToolResponse(toolName: string, response: any): Array<{ type: string; text: string }> {
    const baseContent = (response as any).content || [
      { type: "text", text: "Tool executed successfully" },
    ];

    // For query tools, provide better context
    if (toolName === "get_current_page_info" || toolName === "query_elements") {
      const responseText = baseContent[0]?.text || "";
      
      // Try to parse and enhance page info response
      try {
        const pageData = JSON.parse(responseText);
        if (pageData.elements && Array.isArray(pageData.elements)) {
          const elementCount = pageData.elements.length;
          const elementTypes = pageData.elements.reduce((acc: Record<string, number>, el: any) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {});
          
          let enhancedText = `Found ${elementCount} elements on the page:\n`;
          Object.entries(elementTypes).forEach(([type, count]) => {
            enhancedText += `- ${count} ${type.toLowerCase()} element${count !== 1 ? 's' : ''}\n`;
          });
          
          // Add element details for the first few elements
          if (pageData.elements.length > 0) {
            enhancedText += "\nRecent elements:\n";
            pageData.elements.slice(0, 5).forEach((el: any) => {
              const text = el.text ? ` ("${el.text}")` : '';
              enhancedText += `- ${el.type} (ID: ${el.id})${text}\n`;
            });
          }
          
          return [{ type: "text", text: enhancedText }];
        }
      } catch (error) {
        // If parsing fails, return original content
      }
    }

    return baseContent;
  }
}
