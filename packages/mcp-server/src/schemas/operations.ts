/**
 * Schema definitions for advanced operation tools
 */

import { z } from "zod";

// Schema for move element operation
export const MoveElementSchema = z.object({
  elementId: z.string().describe("ID of the element to move"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).describe("New position for the element"),
  relative: z.boolean().optional().describe("If true, position is relative to current position (default: false)"),
  animate: z.boolean().optional().describe("If true, animate the movement in FigJam (default: false)")
});

// Schema for resize element operation
export const ResizeElementSchema = z.object({
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
export const RotateElementSchema = z.object({
  elementId: z.string().describe("ID of the element to rotate"),
  rotation: z.number().describe("Rotation angle in radians"),
  relative: z.boolean().optional().describe("If true, rotation is relative to current rotation (default: false)"),
  anchorPoint: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Custom rotation anchor point (default: element center)")
});

// Schema for tidy up operation
export const TidyUpSchema = z.object({
  elementIds: z.array(z.string()).optional().describe("Specific element IDs to organize (if not provided, organizes all page elements)"),
  strategy: z.enum(['AUTO', 'GRID', 'FLOW', 'CLUSTER']).optional().describe("Organization strategy (default: AUTO)"),
  spacing: z.number().optional().describe("Minimum spacing between elements in pixels (default: 20)"),
  alignment: z.enum(['LEFT', 'CENTER', 'RIGHT', 'TOP', 'MIDDLE', 'BOTTOM']).optional().describe("Element alignment (default: TOP)"),
  groupSimilar: z.boolean().optional().describe("Group elements with similar properties (default: true)"),
  removeOverlaps: z.boolean().optional().describe("Remove overlapping elements (default: true)"),
  optimizeConnections: z.boolean().optional().describe("Optimize connector paths in FigJam (default: false)")
});