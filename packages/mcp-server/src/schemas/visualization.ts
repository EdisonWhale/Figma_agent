/**
 * Schema definitions for advanced visualization tools
 */

import { z } from "zod";

// Schema for create chart operation
export const CreateChartSchema = z.object({
  type: z.enum(['BAR', 'LINE', 'PIE', 'SCATTER', 'AREA', 'DONUT', 'HISTOGRAM']).describe("Type of chart to create"),
  data: z.array(z.object({
    label: z.string().describe("Data point label"),
    value: z.number().describe("Data point value"),
    color: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional().describe("Custom color for this data point")
  })).describe("Chart data points"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Chart position (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Chart size (default: {width: 400, height: 300})"),
  title: z.string().optional().describe("Chart title"),
  showLegend: z.boolean().optional().describe("Show chart legend (default: true)"),
  showGrid: z.boolean().optional().describe("Show grid lines (default: true)"),
  showAxes: z.boolean().optional().describe("Show axes (default: true)"),
  colorScheme: z.enum(['BLUE', 'GREEN', 'RED', 'PURPLE', 'ORANGE', 'MULTI']).optional().describe("Color scheme (default: MULTI)"),
  backgroundColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Background color (default: white)"),
  textColor: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }).optional().describe("Text color (default: dark gray)"),
  fontSize: z.number().optional().describe("Font size (default: 12)"),
  fontFamily: z.string().optional().describe("Font family (default: Inter)")
});

// Schema for create diagram operation
export const CreateDiagramSchema = z.object({
  type: z.enum(['ORG_CHART', 'NETWORK', 'TIMELINE', 'PROCESS_FLOW', 'HIERARCHY', 'MATRIX']).describe("Type of diagram to create"),
  nodes: z.array(z.object({
    id: z.string().describe("Unique node identifier"),
    label: z.string().describe("Node display text"),
    type: z.enum(['LEADER', 'MANAGER', 'EMPLOYEE', 'PROCESS', 'DECISION', 'EVENT', 'MILESTONE']).optional().describe("Node type for styling"),
    level: z.number().optional().describe("Hierarchy level (0 = top level)"),
    parentId: z.string().optional().describe("Parent node ID for hierarchical diagrams"),
    data: z.any().optional().describe("Additional node data"),
    color: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional().describe("Custom node color"),
    icon: z.string().optional().describe("Node icon identifier")
  })).describe("Diagram nodes"),
  connections: z.array(z.object({
    from: z.string().describe("Source node ID"),
    to: z.string().describe("Target node ID"),
    label: z.string().optional().describe("Connection label"),
    type: z.enum(['SOLID', 'DASHED', 'DOTTED', 'ARROW']).optional().describe("Connection line type"),
    weight: z.number().optional().describe("Connection weight/thickness")
  })).optional().describe("Node connections"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Diagram position (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Diagram size (default: {width: 600, height: 400})"),
  title: z.string().optional().describe("Diagram title"),
  layout: z.enum(['TOP_DOWN', 'LEFT_RIGHT', 'RADIAL', 'CIRCULAR', 'MATRIX', 'AUTO']).optional().describe("Layout algorithm (default: AUTO)"),
  spacing: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Node spacing (default: {x: 120, y: 80})"),
  nodeStyle: z.object({
    backgroundColor: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional(),
    textColor: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional(),
    borderColor: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional(),
    borderWidth: z.number().optional(),
    cornerRadius: z.number().optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    padding: z.number().optional()
  }).optional().describe("Node styling options"),
  connectionStyle: z.object({
    strokeColor: z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }).optional(),
    strokeWeight: z.number().optional(),
    strokeStyle: z.enum(['SOLID', 'DASHED', 'DOTTED']).optional(),
    arrowType: z.enum(['NONE', 'ARROW', 'CIRCLE', 'DIAMOND']).optional()
  }).optional().describe("Connection styling options")
});

// Schema for create visualization operation
export const CreateVisualizationSchema = z.object({
  type: z.enum(['CUSTOM', 'DASHBOARD', 'INFOGRAPHIC', 'DATA_STORY', 'COMPARISON', 'TREND_ANALYSIS']).describe("Type of visualization to create"),
  elements: z.array(z.object({
    type: z.enum(['CHART', 'TEXT', 'ICON', 'IMAGE', 'SHAPE', 'METRIC']).describe("Element type"),
    data: z.any().describe("Element data/configuration"),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional().describe("Custom element position"),
    size: z.object({
      width: z.number(),
      height: z.number(),
    }).optional().describe("Custom element size"),
    style: z.any().optional().describe("Element styling options")
  })).describe("Visualization elements"),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe("Visualization position (default: {x: 0, y: 0})"),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional().describe("Visualization size (default: {width: 800, height: 600})"),
  title: z.string().optional().describe("Visualization title"),
  layout: z.enum(['GRID', 'FLOW', 'LAYERED', 'RADIAL']).optional().describe("Element layout pattern (default: GRID)"),
  theme: z.enum(['LIGHT', 'DARK', 'COLORFUL', 'MINIMAL']).optional().describe("Visual theme (default: LIGHT)"),
  responsive: z.boolean().optional().describe("Enable responsive layout (default: false)")
});