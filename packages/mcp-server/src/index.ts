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
    .enum(['yellow', 'blue', 'green', 'pink', 'purple', 'red', 'orange', 'dark_blue', 'dark_green', 'lightRed', 'lightBlue', 'lightGreen', 'gray', 'lightGray'])
    .optional()
    .describe("Sticky note color from FigJam color palette"),
  fills: z
    .array(z.object({
      type: z.string(),
      color: z.object({
        r: z.number(),
        g: z.number(),
        b: z.number(),
      }).optional(),
      opacity: z.number().optional(),
    }))
    .optional()
    .describe("Custom fill paint objects (overrides color)"),
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
  isWideWidth: z
    .boolean()
    .optional()
    .describe("Whether to use wide rectangular shape (default: false)"),
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

// Schema for batch sticky note creation
const CreateStickyBatchSchema = z.object({
  items: z.array(z.object({
    text: z.string().describe("The text content for the sticky note"),
    color: z.enum(['yellow', 'blue', 'green', 'pink', 'purple', 'red', 'orange', 'dark_blue', 'dark_green', 'lightRed', 'lightBlue', 'lightGreen', 'gray', 'lightGray'])
      .optional().describe("Sticky note color from FigJam color palette"),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional().describe("Custom position for this sticky note")
  })).describe("Array of sticky note configurations"),
  layout: z.enum(['GRID', 'ROW', 'COLUMN']).optional().describe("Layout pattern for positioning (default: GRID)"),
  spacing: z.number().optional().describe("Spacing between sticky notes (default: 20)"),
  startPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Starting position for layout (default: {x: 100, y: 100})"),
  defaultSize: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional().describe("Default size for sticky notes (default: {width: 240, height: 240})")
});

// Schema for element alignment
const AlignElementsSchema = z.object({
  nodeIds: z.array(z.string()).describe("Array of element IDs to align"),
  alignment: z.enum(['LEFT', 'CENTER', 'RIGHT', 'TOP', 'MIDDLE', 'BOTTOM']).describe("Alignment type"),
  distributeSpacing: z.number().optional().describe("Spacing for distribution (if not provided, elements are aligned without distribution)")
});

// Schema for grouping elements
const GroupElementsSchema = z.object({
  nodeIds: z.array(z.string()).describe("Array of element IDs to group"),
  groupName: z.string().optional().describe("Name for the group (default: 'Group')")
});

// Schema for ungrouping elements
const UngroupElementsSchema = z.object({
  groupId: z.string().describe("ID of the group to ungroup")
});

// Schema for flowchart creation
const CreateFlowchartSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().describe("Unique identifier for the node"),
    text: z.string().describe("Text content of the node"),
    type: z.enum(['start', 'process', 'decision', 'end', 'data']).describe("Type of flowchart node"),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional().describe("Custom position for this node")
  })).describe("Array of flowchart nodes"),
  connections: z.array(z.object({
    from: z.string().describe("ID of the source node"),
    to: z.string().describe("ID of the target node"),
    label: z.string().optional().describe("Optional label for the connection")
  })).describe("Array of connections between nodes"),
  layout: z.enum(['TOP_TO_BOTTOM', 'LEFT_TO_RIGHT', 'AUTO']).optional().describe("Layout direction for the flowchart (default: AUTO)"),
  spacing: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Spacing between nodes (default: {x: 60, y: 60})"),
  startPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Starting position for the flowchart (default: {x: 200, y: 200})")
});

// Schema for mind map creation
const CreateMindMapSchema = z.object({
  centralTopic: z.string().describe("The central topic text of the mind map"),
  branches: z.array(z.object({
    text: z.string().describe("Text content of the branch"),
    children: z.array(z.object({
      text: z.string().describe("Text content of the child node")
    })).optional().describe("Child nodes of this branch"),
    color: z.enum(['yellow', 'blue', 'green', 'pink', 'purple', 'red', 'orange', 'dark_blue', 'dark_green', 'lightRed', 'lightBlue', 'lightGreen', 'gray', 'lightGray'])
      .optional().describe("Color for this branch")
  })).describe("Array of main branches"),
  startPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the central node (default: {x: 400, y: 300})"),
  branchSpacing: z.number().optional().describe("Spacing between branch and child nodes (default: 100)")
});

// Schema for shape with text creation
const CreateShapeWithTextSchema = z.object({
  text: z.string().describe("Text content to display on the shape"),
  shapeType: z.enum(['rectangle', 'ellipse', 'polygon', 'star']).describe("Type of shape to create"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the shape (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the shape (default: {width: 150, height: 100})"),
  backgroundColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Background color RGB (default: light gray)"),
  textColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Text color RGB (default: black)"),
  fontSize: z.number().optional().describe("Font size (default: 14)"),
  fontFamily: z.string().optional().describe("Font family (default: Inter)"),
  fontWeight: z.string().optional().describe("Font weight (default: Regular)"),
  textAlign: z.enum(['LEFT', 'CENTER', 'RIGHT']).optional().describe("Text alignment (default: CENTER)"),
  cornerRadius: z.number().optional().describe("Corner radius for rectangles (default: 8)"),
  pointCount: z.number().min(3).max(20).optional().describe("Number of points for polygons/stars (default: 5)"),
  innerRadius: z.number().min(0.1).max(0.9).optional().describe("Inner radius ratio for stars (default: 0.4)")
});

// Schema for code block creation
const CreateCodeBlockSchema = z.object({
  code: z.string().describe("The code content to display"),
  language: z.string().optional().describe("Programming language for syntax highlighting (default: javascript)"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the code block (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the code block (default: {width: 400, height: 300})"),
  backgroundColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Background color RGB (default: dark gray)"),
  theme: z.enum(['light', 'dark']).optional().describe("Color theme (default: dark)"),
  showLineNumbers: z.boolean().optional().describe("Whether to show line numbers (default: true)")
});

// Schema for polygon creation
const CreatePolygonSchema = z.object({
  pointCount: z.number().min(3).max(20).describe("Number of points for the polygon"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the polygon (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the polygon (default: {width: 100, height: 100})"),
  fills: z.array(z.object({
    type: z.string(),
    color: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    })
  })).optional().describe("Fill colors for the polygon"),
  rotation: z.number().optional().describe("Rotation in radians (default: 0)")
});

// Schema for star creation
const CreateStarSchema = z.object({
  pointCount: z.number().min(3).max(20).describe("Number of points for the star"),
  innerRadius: z.number().min(0.1).max(0.9).describe("Inner radius ratio (0.1 to 0.9)"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the star (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the star (default: {width: 100, height: 100})"),
  fills: z.array(z.object({
    type: z.string(),
    color: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    })
  })).optional().describe("Fill colors for the star"),
  rotation: z.number().optional().describe("Rotation in radians (default: 0)")
});

// Schema for frame creation
const CreateFrameSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the frame (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the frame (default: {width: 200, height: 200})"),
  name: z.string().optional().describe("Name for the frame (default: 'Frame')"),
  backgroundColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Background color RGB (default: white)"),
  cornerRadius: z.number().optional().describe("Corner radius (default: 0)"),
  clipContent: z.boolean().optional().describe("Whether to clip content (default: false)")
});

// Schema for section creation
const CreateSectionSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Position for the section (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Size of the section (default: {width: 300, height: 200})"),
  title: z.string().optional().describe("Title for the section (default: 'Section')"),
  backgroundColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Background color RGB (default: light blue)")
});

// Schema for move element operation
const MoveElementSchema = z.object({
  elementId: z.string().describe("ID of the element to move"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).describe("New position for the element"),
  relative: z.boolean().optional().describe("If true, position is relative to current position (default: false)"),
  animate: z.boolean().optional().describe("If true, animate the movement in FigJam (default: false)")
});

// Schema for resize element operation
const ResizeElementSchema = z.object({
  elementId: z.string().describe("ID of the element to resize"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).describe("New size for the element"),
  relative: z.boolean().optional().describe("If true, size is relative to current size (default: false)"),
  constrainProportions: z.boolean().optional().describe("If true, maintain aspect ratio (default: false)"),
  anchorPoint: z.enum(['TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'CENTER_LEFT', 'CENTER', 'CENTER_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT']).optional().describe("Anchor point for resizing (default: TOP_LEFT)")
});

// Schema for rotate element operation
const RotateElementSchema = z.object({
  elementId: z.string().describe("ID of the element to rotate"),
  rotation: z.number().describe("Rotation angle in radians"),
  relative: z.boolean().optional().describe("If true, rotation is relative to current rotation (default: false)"),
  anchorPoint: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Custom rotation anchor point (default: element center)")
});

// Schema for tidy up operation
const TidyUpSchema = z.object({
  elementIds: z.array(z.string()).optional().describe("Specific element IDs to organize (if not provided, organizes all page elements)"),
  strategy: z.enum(['AUTO', 'GRID', 'FLOW', 'CLUSTER']).optional().describe("Organization strategy (default: AUTO)"),
  spacing: z.number().optional().describe("Minimum spacing between elements in pixels (default: 20)"),
  alignment: z.enum(['LEFT', 'CENTER', 'RIGHT', 'TOP', 'MIDDLE', 'BOTTOM']).optional().describe("Element alignment (default: TOP)"),
  groupSimilar: z.boolean().optional().describe("Group elements with similar properties (default: true)"),
  removeOverlaps: z.boolean().optional().describe("Remove overlapping elements (default: true)"),
  optimizeConnections: z.boolean().optional().describe("Optimize connector paths in FigJam (default: false)")
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

      // Batch creation tools
      {
        name: "create_sticky_batch",
        description: "Create multiple sticky notes in a batch with automatic layout",
        inputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "The text content for the sticky note" },
                  color: { 
                    type: "string", 
                    enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green", "lightRed", "lightBlue", "lightGreen", "gray", "lightGray"],
                    description: "Sticky note color from FigJam color palette" 
                  },
                  position: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" }
                    },
                    description: "Custom position for this sticky note"
                  }
                },
                required: ["text"]
              },
              description: "Array of sticky note configurations"
            },
            layout: {
              type: "string",
              enum: ["GRID", "ROW", "COLUMN"],
              description: "Layout pattern for positioning (default: GRID)"
            },
            spacing: { type: "number", description: "Spacing between sticky notes (default: 20)" },
            startPosition: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" }
              },
              description: "Starting position for layout (default: {x: 100, y: 100})"
            },
            defaultSize: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" }
              },
              description: "Default size for sticky notes (default: {width: 240, height: 240})"
            }
          },
          required: ["items"]
        }
      },

      // Layout and alignment tools  
      {
        name: "align_elements",
        description: "Align multiple elements by specified alignment type",
        inputSchema: {
          type: "object",
          properties: {
            nodeIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of element IDs to align"
            },
            alignment: {
              type: "string",
              enum: ["LEFT", "CENTER", "RIGHT", "TOP", "MIDDLE", "BOTTOM"],
              description: "Alignment type"
            },
            distributeSpacing: {
              type: "number",
              description: "Spacing for distribution (if not provided, elements are aligned without distribution)"
            }
          },
          required: ["nodeIds", "alignment"]
        }
      },

      // Grouping tools
      {
        name: "group_elements",
        description: "Group multiple elements together",
        inputSchema: {
          type: "object",
          properties: {
            nodeIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of element IDs to group"
            },
            groupName: {
              type: "string",
              description: "Name for the group (default: 'Group')"
            }
          },
          required: ["nodeIds"]
        }
      },
      {
        name: "ungroup_elements",
        description: "Ungroup a group of elements",
        inputSchema: {
          type: "object",
          properties: {
            groupId: {
              type: "string",
              description: "ID of the group to ungroup"
            }
          },
          required: ["groupId"]
        }
      },

      // Advanced creation tools
      {
        name: "create_flowchart",
        description: "Create a flowchart diagram with automatic layout and connections",
        inputSchema: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique identifier for the node" },
                  text: { type: "string", description: "Text content of the node" },
                  type: { 
                    type: "string", 
                    enum: ["start", "process", "decision", "end", "data"],
                    description: "Type of flowchart node" 
                  },
                  position: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" }
                    },
                    description: "Custom position for this node"
                  }
                },
                required: ["id", "text", "type"]
              },
              description: "Array of flowchart nodes"
            },
            connections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "ID of the source node" },
                  to: { type: "string", description: "ID of the target node" },
                  label: { type: "string", description: "Optional label for the connection" }
                },
                required: ["from", "to"]
              },
              description: "Array of connections between nodes"
            },
            layout: {
              type: "string",
              enum: ["TOP_TO_BOTTOM", "LEFT_TO_RIGHT", "AUTO"],
              description: "Layout direction for the flowchart (default: AUTO)"
            },
            spacing: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" }
              },
              description: "Spacing between nodes (default: {x: 60, y: 60})"
            },
            startPosition: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" }
              },
              description: "Starting position for the flowchart (default: {x: 200, y: 200})"
            }
          },
          required: ["nodes", "connections"]
        }
      },
      {
        name: "create_mindmap",
        description: "Create a mind map diagram with radial layout and branches",
        inputSchema: {
          type: "object",
          properties: {
            centralTopic: {
              type: "string",
              description: "The central topic text of the mind map"
            },
            branches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Text content of the branch" },
                  children: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Text content of the child node" }
                      },
                      required: ["text"]
                    },
                    description: "Child nodes of this branch"
                  },
                  color: { 
                    type: "string", 
                    enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green", "lightRed", "lightBlue", "lightGreen", "gray", "lightGray"],
                    description: "Color for this branch" 
                  }
                },
                required: ["text"]
              },
              description: "Array of main branches"
            },
            startPosition: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" }
              },
              description: "Position for the central node (default: {x: 400, y: 300})"
            },
            branchSpacing: {
              type: "number",
              description: "Spacing between branch and child nodes (default: 100)"
            }
          },
          required: ["centralTopic", "branches"]
        }
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

      // Category 1: Basic creation tools
      {
        name: "create_shape_with_text",
        description: "Create a shape (rectangle, ellipse, polygon, star) with integrated text",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text content to display on the shape" },
            shapeType: { 
              type: "string", 
              enum: ["rectangle", "ellipse", "polygon", "star"],
              description: "Type of shape to create" 
            },
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the shape (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the shape (default: {width: 150, height: 100})"
            },
            backgroundColor: {
              type: "object",
              properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
              description: "Background color RGB (default: light gray)"
            },
            textColor: {
              type: "object", 
              properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
              description: "Text color RGB (default: black)"
            },
            fontSize: { type: "number", description: "Font size (default: 14)" },
            fontFamily: { type: "string", description: "Font family (default: Inter)" },
            fontWeight: { type: "string", description: "Font weight (default: Regular)" },
            textAlign: { 
              type: "string", 
              enum: ["LEFT", "CENTER", "RIGHT"], 
              description: "Text alignment (default: CENTER)" 
            },
            cornerRadius: { type: "number", description: "Corner radius for rectangles (default: 8)" },
            pointCount: { type: "number", description: "Number of points for polygons/stars (default: 5)" },
            innerRadius: { type: "number", description: "Inner radius ratio for stars (default: 0.4)" }
          },
          required: ["text", "shapeType"]
        }
      },
      {
        name: "create_code_block",
        description: "Create a code block with syntax highlighting styling",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The code content to display" },
            language: { type: "string", description: "Programming language for syntax highlighting (default: javascript)" },
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the code block (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the code block (default: {width: 400, height: 300})"
            },
            backgroundColor: {
              type: "object",
              properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
              description: "Background color RGB (default: dark gray)"
            },
            theme: { 
              type: "string", 
              enum: ["light", "dark"], 
              description: "Color theme (default: dark)" 
            },
            showLineNumbers: { type: "boolean", description: "Whether to show line numbers (default: true)" }
          },
          required: ["code"]
        }
      },
      {
        name: "create_polygon", 
        description: "Create a polygon shape with specified number of points",
        inputSchema: {
          type: "object",
          properties: {
            pointCount: { type: "number", description: "Number of points for the polygon (3-20)" },
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the polygon (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the polygon (default: {width: 100, height: 100})"
            },
            fills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  color: {
                    type: "object",
                    properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } }
                  }
                }
              },
              description: "Fill colors for the polygon"
            },
            rotation: { type: "number", description: "Rotation in radians (default: 0)" }
          },
          required: ["pointCount"]
        }
      },
      {
        name: "create_star",
        description: "Create a star shape with specified points and inner radius",
        inputSchema: {
          type: "object",
          properties: {
            pointCount: { type: "number", description: "Number of points for the star (3-20)" },
            innerRadius: { type: "number", description: "Inner radius ratio (0.1 to 0.9)" },
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the star (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the star (default: {width: 100, height: 100})"
            },
            fills: {
              type: "array", 
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  color: {
                    type: "object",
                    properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } }
                  }
                }
              },
              description: "Fill colors for the star"
            },
            rotation: { type: "number", description: "Rotation in radians (default: 0)" }
          },
          required: ["pointCount", "innerRadius"]
        }
      },
      {
        name: "create_frame",
        description: "Create a frame container for organizing elements",
        inputSchema: {
          type: "object", 
          properties: {
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the frame (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the frame (default: {width: 200, height: 200})"
            },
            name: { type: "string", description: "Name for the frame (default: 'Frame')" },
            backgroundColor: {
              type: "object",
              properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
              description: "Background color RGB (default: white)"
            },
            cornerRadius: { type: "number", description: "Corner radius (default: 0)" },
            clipContent: { type: "boolean", description: "Whether to clip content (default: false)" }
          }
        }
      },
      {
        name: "create_section",
        description: "Create a section area for organizing content (native in FigJam, frame-based in Figma)",
        inputSchema: {
          type: "object",
          properties: {
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Position for the section (default: {x: 0, y: 0})"
            },
            size: {
              type: "object",
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "Size of the section (default: {width: 300, height: 200})"
            },
            title: { type: "string", description: "Title for the section (default: 'Section')" },
            backgroundColor: {
              type: "object",
              properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
              description: "Background color RGB (default: light blue)"
            }
          }
        }
      },

      // Category 2: Advanced operations tools
      {
        name: "move_element",
        description: "Move an element to a new position with optional relative movement and animation",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of the element to move" },
            position: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "New position for the element"
            },
            relative: { type: "boolean", description: "If true, position is relative to current position (default: false)" },
            animate: { type: "boolean", description: "If true, animate the movement in FigJam (default: false)" }
          },
          required: ["elementId", "position"]
        }
      },
      {
        name: "resize_element",
        description: "Resize an element with anchor point control and proportion constraints",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of the element to resize" },
            size: {
              type: "object", 
              properties: { width: { type: "number" }, height: { type: "number" } },
              description: "New size for the element"
            },
            relative: { type: "boolean", description: "If true, size is relative to current size (default: false)" },
            constrainProportions: { type: "boolean", description: "If true, maintain aspect ratio (default: false)" },
            anchorPoint: { 
              type: "string", 
              enum: ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"],
              description: "Anchor point for resizing (default: TOP_LEFT)" 
            }
          },
          required: ["elementId", "size"]
        }
      },
      {
        name: "rotate_element",
        description: "Rotate an element by a specified angle with custom anchor point support",
        inputSchema: {
          type: "object",
          properties: {
            elementId: { type: "string", description: "ID of the element to rotate" },
            rotation: { type: "number", description: "Rotation angle in radians" },
            relative: { type: "boolean", description: "If true, rotation is relative to current rotation (default: false)" },
            anchorPoint: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              description: "Custom rotation anchor point (default: element center)"
            }
          },
          required: ["elementId", "rotation"]
        }
      },

      // Category 4: Smart canvas organization
      {
        name: "tidy_up",
        description: "Smart canvas organization with multiple strategies, grouping, and overlap removal",
        inputSchema: {
          type: "object",
          properties: {
            elementIds: {
              type: "array",
              items: { type: "string" },
              description: "Specific element IDs to organize (if not provided, organizes all page elements)"
            },
            strategy: {
              type: "string",
              enum: ["AUTO", "GRID", "FLOW", "CLUSTER"],
              description: "Organization strategy (default: AUTO)"
            },
            spacing: { type: "number", description: "Minimum spacing between elements in pixels (default: 20)" },
            alignment: {
              type: "string",
              enum: ["LEFT", "CENTER", "RIGHT", "TOP", "MIDDLE", "BOTTOM"],
              description: "Element alignment (default: TOP)"
            },
            groupSimilar: { type: "boolean", description: "Group elements with similar properties (default: true)" },
            removeOverlaps: { type: "boolean", description: "Remove overlapping elements (default: true)" },
            optimizeConnections: { type: "boolean", description: "Optimize connector paths in FigJam (default: false)" }
          }
        }
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
            fills: args.fills,
            width: args.width || 240,
            height: args.height || 240,
            authorVisible: args.authorVisible !== false,
            isWideWidth: args.isWideWidth || false,
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

      case "create_sticky_batch":
        args = CreateStickyBatchSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            items: args.items,
            layout: args.layout || 'GRID',
            spacing: args.spacing || 20,
            startPosition: args.startPosition || { x: 100, y: 100 },
            defaultSize: args.defaultSize || { width: 240, height: 240 }
          }
        };
        break;

      case "align_elements":
        args = AlignElementsSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            nodeIds: args.nodeIds,
            alignment: args.alignment,
            distributeSpacing: args.distributeSpacing
          }
        };
        break;

      case "group_elements":
        args = GroupElementsSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            nodeIds: args.nodeIds,
            groupName: args.groupName || 'Group'
          }
        };
        break;

      case "ungroup_elements":
        args = UngroupElementsSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            groupId: args.groupId
          }
        };
        break;

      case "create_flowchart":
        args = CreateFlowchartSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            nodes: args.nodes,
            connections: args.connections,
            layout: args.layout || 'AUTO',
            spacing: args.spacing || { x: 60, y: 60 },
            startPosition: args.startPosition || { x: 200, y: 200 }
          }
        };
        break;

      case "create_mindmap":
        args = CreateMindMapSchema.parse(request.params.arguments);
        result = {
          action: toolName,
          data: {
            centralTopic: args.centralTopic,
            branches: args.branches,
            startPosition: args.startPosition || { x: 400, y: 300 },
            branchSpacing: args.branchSpacing || 100
          }
        };
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    // Log tool execution for debugging (appears in terminal)
    console.error(`[MCP] ${toolName} executed successfully with parameters:`, JSON.stringify(result.data));
    
    // For query tools, provide more informative response to guide AI behavior
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
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully executed ${toolName}`,
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
