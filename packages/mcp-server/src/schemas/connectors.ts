/**
 * Schema definitions for connector management tools
 */

import { z } from "zod";

// Schema for update connector operation
export const UpdateConnectorSchema = z.object({
  connectorId: z.string().describe("ID of the connector to update"),
  startElementId: z.string().optional().describe("New start element ID"),
  endElementId: z.string().optional().describe("New end element ID"),
  startPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("New start position (if not connected to element)"),
  endPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("New end position (if not connected to element)"),
  strokeWeight: z.number().optional().describe("New stroke weight"),
  strokeColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("New stroke color RGB"),
  strokeStyle: z.enum(['SOLID', 'DASHED']).optional().describe("Stroke style (default: SOLID)"),
  cornerRadius: z.number().optional().describe("Corner radius for rounded connectors"),
  magnet: z.enum(['AUTO', 'TOP', 'RIGHT', 'BOTTOM', 'LEFT']).optional().describe("Magnet type for connection points (default: AUTO)")
});

// Schema for delete connector operation
export const DeleteConnectorSchema = z.object({
  connectorId: z.string().describe("ID of the connector to delete")
});

// Schema for query connectors operation
export const QueryConnectorsSchema = z.object({
  elementIds: z.array(z.string()).optional().describe("Filter connectors connected to these element IDs"),
  region: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional().describe("Filter connectors within this region"),
  strokeWeightRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional().describe("Filter by stroke weight range"),
  strokeColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Filter by stroke color (with tolerance)"),
  includeDetails: z.boolean().optional().describe("Include detailed connector information (default: true)")
});

// Schema for optimize connector paths operation
export const OptimizeConnectorPathsSchema = z.object({
  connectorIds: z.array(z.string()).optional().describe("Specific connector IDs to optimize (if not provided, optimizes all connectors)"),
  strategy: z.enum(['SHORTEST', 'AVOID_OVERLAPS', 'MANHATTAN', 'ORTHOGONAL']).optional().describe("Optimization strategy (default: AVOID_OVERLAPS)"),
  margin: z.number().optional().describe("Minimum margin from elements in pixels (default: 10)"),
  cornerRadius: z.number().optional().describe("Corner radius for optimized paths (default: 8)")
});