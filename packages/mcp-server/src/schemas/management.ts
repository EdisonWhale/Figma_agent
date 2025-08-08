/**
 * Schema definitions for element management tools
 */

import { z } from "zod";

// Schema for element deletion
export const DeleteElementSchema = z.object({
  elementId: z.string().describe("ID of element to delete"),
});

// Schema for multiple elements deletion
export const DeleteElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to delete"),
});

// Schema for element update
export const UpdateElementSchema = z.object({
  elementId: z.string().describe("ID of element to update"),
  properties: z.record(z.any()).describe("Properties to update"),
});

// Schema for element selection
export const SelectElementsSchema = z.object({
  elementIds: z.array(z.string()).describe("Array of element IDs to select"),
});

// Schema for element duplication
export const DuplicateElementSchema = z.object({
  elementId: z.string().describe("ID of element to duplicate"),
  offsetX: z.number().optional().describe("X offset for duplicate (default: 20)"),
  offsetY: z.number().optional().describe("Y offset for duplicate (default: 20)"),
});

// Schema for element details query
export const GetElementDetailsSchema = z.object({
  elementId: z.string().describe("ID of element to get details for"),
});

// Schema for element query
export const QueryElementsSchema = z.object({
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