/**
 * Schema definitions for advanced creation tools
 */

import { z } from "zod";

// Schema for flowchart creation
export const CreateFlowchartSchema = z.object({
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
export const CreateMindMapSchema = z.object({
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
export const CreateShapeWithTextSchema = z.object({
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
export const CreateCodeBlockSchema = z.object({
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
export const CreatePolygonSchema = z.object({
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
export const CreateStarSchema = z.object({
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
export const CreateFrameSchema = z.object({
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
export const CreateSectionSchema = z.object({
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