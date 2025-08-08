/**
 * Schema definitions for element creation tools
 */

import { z } from "zod";

// Schema for sticky note creation
export const CreateStickyNoteSchema = z.object({
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
export const CreateRectangleSchema = z.object({
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
export const CreateEllipseSchema = z.object({
  x: z.number().optional().describe("X position (default: 0)"),
  y: z.number().optional().describe("Y position (default: 0)"),
  width: z.number().optional().describe("Width (default: 100)"),
  height: z.number().optional().describe("Height (default: 100)"),
  fills: z.array(z.any()).optional().describe("Fill colors"),
  strokes: z.array(z.any()).optional().describe("Stroke colors"),
  name: z.string().optional().describe("Element name"),
});

// Schema for text creation
export const CreateTextSchema = z.object({
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
export const CreateConnectorSchema = z.object({
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