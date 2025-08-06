/**
 * MCP Service
 * Handles connection and communication with MCP servers
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "@utils/logger";
import path from "path";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
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

  constructor() {
    logger.info({}, "[MCP] Service initialized");
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
   * Call a tool
   */
  public async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client || !this.isConnected) {
      throw new Error("MCP client not connected");
    }

    try {
      logger.info(
        { toolName: toolCall.name, args: toolCall.arguments },
        "[MCP] Calling tool"
      );

      const response = await this.client.callTool({
        name: toolCall.name,
        arguments: toolCall.arguments,
      });

      logger.info(
        { toolName: toolCall.name, success: true },
        "[MCP] Tool call completed"
      );

      return {
        content: (response as any).content || [
          { type: "text", text: "Tool executed successfully" },
        ],
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
}
