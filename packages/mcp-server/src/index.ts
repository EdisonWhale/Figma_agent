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

// Schema for rectangle creation
const CreateRectangleSchema = z.object({
  x: z.number().optional().describe("X position (default: 0)"),
  y: z.number().optional().describe("Y position (default: 0)"),
  width: z.number().optional().describe("Width (default: 100)"),
  height: z.number().optional().describe("Height (default: 100)"),
  fills: z.array(z.any()).optional().describe("Fill colors"),
  strokes: z.array(z.any()).optional().describe("Stroke colors"),
  cornerRadius: z.number().optional().describe("Corner radius"),
  name: z.string().optional().describe("Element name"),
});

// Schema for ellipse creation
const CreateEllipseSchema = z.object({
  x: z.number().optional().describe("X position (default: 0)"),
  y: z.number().optional().describe("Y position (default: 0)"),
  width: z.number().optional().describe("Width (default: 100)"),
  height: z.number().optional().describe("Height (default: 100)"),
  fills: z.array(z.any()).optional().describe("Fill colors"),
  strokes: z.array(z.any()).optional().describe("Stroke colors"),
  name: z.string().optional().describe("Element name"),
});

// Schema for text creation
const CreateTextSchema = z.object({
  text: z.string().describe("Text content"),
  x: z.number().optional().describe("X position (default: 0)"),
  y: z.number().optional().describe("Y position (default: 0)"),
  width: z.number().optional().describe("Width (default: 200)"),
  height: z.number().optional().describe("Height (default: 50)"),
  fontSize: z.number().optional().describe("Font size (default: 16)"),
  fontFamily: z.string().optional().describe("Font family (default: Inter)"),
  fontWeight: z.string().optional().describe("Font weight (default: Regular)"),
  textAlign: z.enum(['LEFT', 'CENTER', 'RIGHT']).optional().describe("Text alignment"),
  textColor: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
  }).optional().describe("Text color RGB"),
  name: z.string().optional().describe("Element name"),
});

// Schema for connector creation
const CreateConnectorSchema = z.object({
  startElementId: z.string().describe("ID of the starting element"),
  endElementId: z.string().describe("ID of the ending element"),
  startPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Start position override"),
  endPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("End position override"),
  strokeWeight: z.number().optional().describe("Stroke weight"),
  strokeColor: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
  }).optional().describe("Stroke color RGB"),
});

// Schema for element deletion
const DeleteElementSchema = z.object({
  elementId: z.string().describe("ID of element to delete"),
});

// Schema for multiple elements deletion
const DeleteElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to delete"),
});

// Schema for element update
const UpdateElementSchema = z.object({
  elementId: z.string().describe("ID of element to update"),
  properties: z.record(z.any()).describe("Properties to update"),
});

// Schema for element selection
const SelectElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to select"),
});

// Schema for element duplication
const DuplicateElementSchema = z.object({
  elementId: z.string().describe("ID of element to duplicate"),
  offsetX: z.number().optional().describe("X offset for duplicate (default: 20)"),
  offsetY: z.number().optional().describe("Y offset for duplicate (default: 20)"),
});

// Schema for element details query
const GetElementDetailsSchema = z.object({
  elementId: z.string().describe("ID of element to get details for"),
});

// Schema for element query
const QueryElementsSchema = z.object({
  types: z.array(z.string()).optional().describe("Filter by element types"),
  names: z.array(z.string()).optional().describe("Filter by element names"),
  namePattern: z.string().optional().describe("Filter by name pattern (regex)"),
  region: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional().describe("Filter by region"),
  properties: z.record(z.any()).optional().describe("Filter by properties"),
});

// Schema for element arrangement
const ArrangeElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to arrange"),
  direction: z.enum(['horizontal', 'vertical', 'grid']).describe("Layout direction"),
  spacing: z.number().optional().describe("Spacing between elements"),
  padding: z.number().optional().describe("Padding around layout"),
  alignment: z.enum(['start', 'center', 'end', 'stretch']).optional().describe("Element alignment"),
  columns: z.number().optional().describe("Number of columns (for grid layout)"),
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
      // Page and element information tools
      {
        name: "get_current_page_info",
        description: "Get information about the current page including all elements",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "query_elements",
        description: "Query elements by type, name, region, or properties",
        inputSchema: {
          type: "object",
          properties: {
            types: {
              type: "array",
              items: { type: "string" },
              description: "Filter by element types",
            },
            names: {
              type: "array",
              items: { type: "string" },
              description: "Filter by element names",
            },
            namePattern: {
              type: "string",
              description: "Filter by name pattern (regex)",
            },
            region: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
              },
              description: "Filter by region",
            },
            properties: {
              type: "object",
              description: "Filter by properties",
            },
          },
        },
      },
      {
        name: "get_element_details",
        description: "Get detailed information about a specific element",
        inputSchema: {
          type: "object",
          properties: {
            elementId: {
              type: "string",
              description: "ID of element to get details for",
            },
          },
          required: ["elementId"],
        },
      },
      
      // Element creation tools
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
                "Sticky note color (yellow, blue, green, pink, purple, red, orange, dark_blue, dark_green)",
              enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green"],
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
      {
        name: "create_rectangle",
        description: "Create a rectangle shape with customizable properties",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position (default: 0)" },
            y: { type: "number", description: "Y position (default: 0)" },
            width: { type: "number", description: "Width (default: 100)" },
            height: { type: "number", description: "Height (default: 100)" },
            fills: { type: "array", description: "Fill colors" },
            strokes: { type: "array", description: "Stroke colors" },
            cornerRadius: { type: "number", description: "Corner radius" },
            name: { type: "string", description: "Element name" },
          },
        },
      },
      {
        name: "create_ellipse",
        description: "Create an ellipse shape with customizable properties",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position (default: 0)" },
            y: { type: "number", description: "Y position (default: 0)" },
            width: { type: "number", description: "Width (default: 100)" },
            height: { type: "number", description: "Height (default: 100)" },
            fills: { type: "array", description: "Fill colors" },
            strokes: { type: "array", description: "Stroke colors" },
            name: { type: "string", description: "Element name" },
          },
        },
      },
      {
        name: "create_text",
        description: "Create a text element with customizable styling",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text content" },
            x: { type: "number", description: "X position (default: 0)" },
            y: { type: "number", description: "Y position (default: 0)" },
            width: { type: "number", description: "Width (default: 200)" },
            height: { type: "number", description: "Height (default: 50)" },
            fontSize: { type: "number", description: "Font size (default: 16)" },
            fontFamily: { type: "string", description: "Font family (default: Inter)" },
            fontWeight: { type: "string", description: "Font weight (default: Regular)" },
            textAlign: { 
              type: "string", 
              enum: ["LEFT", "CENTER", "RIGHT"],
              description: "Text alignment" 
            },
            textColor: {
              type: "object",
              properties: {
                r: { type: "number" },
                g: { type: "number" },
                b: { type: "number" },
              },
              description: "Text color RGB",
            },
            name: { type: "string", description: "Element name" },
          },
          required: ["text"],
        },
      },
      {
        name: "create_connector",
        description: "Create a connector line between two elements",
        inputSchema: {
          type: "object",
          properties: {
            startElementId: { type: "string", description: "ID of the starting element" },
            endElementId: { type: "string", description: "ID of the ending element" },
            startPosition: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Start position override",
            },
            endPosition: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "End position override",
            },
            strokeWeight: { type: "number", description: "Stroke weight" },
            strokeColor: {
              type: "object",
              properties: {
                r: { type: "number" },
                g: { type: "number" },
                b: { type: "number" },
              },
              description: "Stroke color RGB",
            },
          },
          required: ["startElementId", "endElementId"],
        },
      },
      
      // Element management tools
      {
        name: "delete_element",
        description: "Delete a single element by ID",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of element to delete" },
          },
          required: ["elementId"],
        },
      },
      {
        name: "delete_elements",
        description: "Delete multiple elements by their IDs",
        inputSchema: {
          type: "object",
          properties: {
            elementIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of element IDs to delete",
            },
          },
          required: ["elementIds"],
        },
      },
      {
        name: "update_element",
        description: "Update properties of an existing element",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of element to update" },
            properties: { type: "object", description: "Properties to update" },
          },
          required: ["elementId", "properties"],
        },
      },
      {
        name: "select_elements",
        description: "Select one or more elements",
        inputSchema: {
          type: "object",
          properties: {
            elementIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of element IDs to select",
            },
          },
          required: ["elementIds"],
        },
      },
      {
        name: "duplicate_element",
        description: "Duplicate an element with optional offset",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of element to duplicate" },
            offsetX: { type: "number", description: "X offset for duplicate (default: 20)" },
            offsetY: { type: "number", description: "Y offset for duplicate (default: 20)" },
          },
          required: ["elementId"],
        },
      },
      
      // Layout and organization tools
      {
        name: "arrange_elements",
        description: "Arrange multiple elements in a layout pattern",
        inputSchema: {
          type: "object",
          properties: {
            elementIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of element IDs to arrange",
            },
            direction: {
              type: "string",
              enum: ["horizontal", "vertical", "grid"],
              description: "Layout direction",
            },
            spacing: { type: "number", description: "Spacing between elements" },
            padding: { type: "number", description: "Padding around layout" },
            alignment: {
              type: "string",
              enum: ["start", "center", "end", "stretch"],
              description: "Element alignment",
            },
            columns: { type: "number", description: "Number of columns (for grid layout)" },
          },
          required: ["elementIds", "direction"],
        },
      },
      
      // Analysis tools
      {
        name: "get_page_statistics",
        description: "Get statistical information about the current page",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    let args: any;
    let result: any;

    switch (toolName) {
      case "get_current_page_info":
        result = { action: toolName, data: {} };
        break;

      case "query_elements":
        args = QueryElementsSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "get_element_details":
        args = GetElementDetailsSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "create_sticky_note":
        args = CreateStickyNoteSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            text: args.text,
            x: args.x || 100,
            y: args.y || 100,
            color: args.color || "yellow",
            width: args.width || 240,
            height: args.height || 240,
            authorVisible: args.authorVisible !== false,
          }
        };
        break;

      case "create_rectangle":
        args = CreateRectangleSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            x: args.x || 0,
            y: args.y || 0,
            width: args.width || 100,
            height: args.height || 100,
            fills: args.fills || [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }],
            strokes: args.strokes,
            cornerRadius: args.cornerRadius,
            name: args.name || "Rectangle",
          }
        };
        break;

      case "create_ellipse":
        args = CreateEllipseSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            x: args.x || 0,
            y: args.y || 0,
            width: args.width || 100,
            height: args.height || 100,
            fills: args.fills || [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }],
            strokes: args.strokes,
            name: args.name || "Ellipse",
          }
        };
        break;

      case "create_text":
        args = CreateTextSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            text: args.text,
            x: args.x || 0,
            y: args.y || 0,
            width: args.width || 200,
            height: args.height || 50,
            fontSize: args.fontSize || 16,
            fontFamily: args.fontFamily || "Inter",
            fontWeight: args.fontWeight || "Regular",
            textAlign: args.textAlign || "LEFT",
            textColor: args.textColor || { r: 0, g: 0, b: 0 },
            name: args.name || "Text",
          }
        };
        break;

      case "create_connector":
        args = CreateConnectorSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            startElementId: args.startElementId,
            endElementId: args.endElementId,
            startPosition: args.startPosition,
            endPosition: args.endPosition,
            strokeWeight: args.strokeWeight || 2,
            strokeColor: args.strokeColor || { r: 0, g: 0, b: 0 },
          }
        };
        break;

      case "delete_element":
        args = DeleteElementSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "delete_elements":
        args = DeleteElementsSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "update_element":
        args = UpdateElementSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "select_elements":
        args = SelectElementsSchema.parse(request.params.arguments);
        result = { action: toolName, data: args };
        break;

      case "duplicate_element":
        args = DuplicateElementSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            elementId: args.elementId,
            offsetX: args.offsetX || 20,
            offsetY: args.offsetY || 20,
          }
        };
        break;

      case "arrange_elements":
        args = ArrangeElementsSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            elementIds: args.elementIds,
            direction: args.direction,
            spacing: args.spacing || 10,
            padding: args.padding || 0,
            alignment: args.alignment || "start",
            columns: args.columns,
          }
        };
        break;

      case "get_page_statistics":
        result = { action: toolName, data: {} };
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `Tool call: ${toolName} with parameters: ${JSON.stringify(result.data)}`,
        },
      ],
    };

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
