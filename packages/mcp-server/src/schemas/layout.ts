/**
 * Schema definitions for layout and alignment tools
 */

import { z } from "zod";

// Schema for element arrangement
export const ArrangeElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to arrange"),
  direction: z.enum(['horizontal', 'vertical', 'grid']).describe("Layout direction"),
  spacing: z.number().optional().describe("Spacing between elements"),
  padding: z.number().optional().describe("Padding around layout"),
  alignment: z.enum(['start', 'center', 'end', 'stretch']).optional().describe("Element alignment"),
  columns: z.number().optional().describe("Number of columns (for grid layout)"),
});

// Schema for batch sticky note creation
export const CreateStickyBatchSchema = z.object({
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
export const AlignElementsSchema = z.object({
  nodeIds: z.array(z.string()).describe("Array of element IDs to align"),
  alignment: z.enum(['LEFT', 'CENTER', 'RIGHT', 'TOP', 'MIDDLE', 'BOTTOM']).describe("Alignment type"),
  distributeSpacing: z.number().optional().describe("Spacing for distribution (if not provided, elements are aligned without distribution)")
});

// Schema for grouping elements
export const GroupElementsSchema = z.object({
  nodeIds: z.array(z.string()).describe("Array of element IDs to group"),
  groupName: z.string().optional().describe("Name for the group (default: 'Group')")
});

// Schema for ungrouping elements
export const UngroupElementsSchema = z.object({
  groupId: z.string().describe("ID of the group to ungroup")
});