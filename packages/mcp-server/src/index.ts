#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Schema for sticky note creation
const CreateStickyNoteSchema = z.object({
  text: z.string().describe("The text content for the sticky note"),
  x: z.number().optional().describe("X position (default: 100)"),
  y: z.number().optional().describe("Y position (default: 100)"),
  color: z
    .string()
    .optional()
    .describe("Sticky note color (yellow, blue, green, pink, purple)"),
  width: z
    .number()
    .optional()
    .describe("Width of the sticky note (default: 240)"),
  height: z
    .number()
    .optional()
    .describe("Height of the sticky note (default: 240)"),
  authorVisible: z
    .boolean()
    .optional()
    .describe("Whether to show author name (default: true)"),
});

// Create MCP server
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

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_sticky_note",
        description:
          "Create a sticky note in FigJam with specified text and optional positioning/styling",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text content for the sticky note",
            },
            x: {
              type: "number",
              description: "X position (default: 100)",
            },
            y: {
              type: "number",
              description: "Y position (default: 100)",
            },
            color: {
              type: "string",
              description:
                "Sticky note color (yellow, blue, green, pink, purple)",
              enum: ["yellow", "blue", "green", "pink", "purple"],
            },
            width: {
              type: "number",
              description: "Width of the sticky note (default: 240)",
            },
            height: {
              type: "number",
              description: "Height of the sticky note (default: 240)",
            },
            authorVisible: {
              type: "boolean",
              description: "Whether to show author name (default: true)",
            },
          },
          required: ["text"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_sticky_note") {
    try {
      const args = CreateStickyNoteSchema.parse(request.params.arguments);

      // Return the tool call parameters for the backend to handle
      return {
        content: [
          {
            type: "text",
            text: `Tool call: create_sticky_note with parameters: ${JSON.stringify(
              {
                text: args.text,
                x: args.x || 100,
                y: args.y || 100,
                color: args.color || "yellow",
                width: args.width || 240,
                height: args.height || 240,
                authorVisible: args.authorVisible !== false,
              }
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error validating parameters: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Main function
async function main() {
  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Figma MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
