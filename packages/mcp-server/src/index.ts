#!/usr/bin/env node

/**
 * Figma MCP Server
 * Refactored and modular architecture for better maintainability
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { toolDefinitions } from './tools/registry.js';
import { toolHandlers } from './handlers/index.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: "figma-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register tool list handler
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions,
  };
});

/**
 * Register tool execution handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    // Get the handler for the requested tool
    const handler = toolHandlers[toolName as keyof typeof toolHandlers];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Execute the handler
    const result = handler(args);

    // Log tool execution for debugging
    console.error(`[MCP] ${toolName} executed successfully with parameters:`, JSON.stringify(result.data));
    
    // Return appropriate response based on tool type
    return formatToolResponse(toolName, result);

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error validating parameters for ${request.params.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Format tool response based on tool type
 */
function formatToolResponse(toolName: string, result: any) {
  // For query tools, provide more informative response
  if (toolName === "get_current_page_info" || toolName.includes("query") || toolName === "get_element_details") {
    return {
      content: [
        {
          type: "text",
          text: `Tool ${toolName} executed successfully. The page elements data has been retrieved and is being processed by the Figma plugin. This query provides information about all elements currently on the canvas, including their IDs, types, positions, and content. You can now use this information to identify existing elements for modification or analysis.`,
        },
      ],
    };
  }
  
  // For modification tools, provide specific guidance
  if (toolName === "update_element" || toolName === "delete_element") {
    return {
      content: [
        {
          type: "text", 
          text: `Tool ${toolName} executed successfully. The element has been modified on the Figma canvas. The changes should be visible to the user immediately.`,
        },
      ],
    };
  }
  
  // Default response
  return {
    content: [
      {
        type: "text",
        text: `Successfully executed ${toolName}`,
      },
    ],
  };
}

/**
 * Main server entry point
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Figma MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

// Start the server
main();