/**
 * Type definitions for Figma API handlers
 */

export interface HandlerContext {
  id: string;
  action: string;
  data: any;
}

export interface ElementCreationData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fills?: Paint[];
  strokes?: Paint[];
  cornerRadius?: number;
}

export interface TextCreationData extends ElementCreationData {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "LEFT" | "CENTER" | "RIGHT";
  textColor?: RGB;
}

export interface StickyNoteData extends ElementCreationData {
  text?: string;
  color?: string;
}

export interface ConnectorData {
  startElementId: string;
  endElementId: string;
  strokeWeight?: number;
  strokeColor?: RGB;
}

export interface BatchOperationResult {
  successful: Array<{
    id: string;
    result: any;
  }>;
  failed: Array<{
    id: string;
    error: string;
  }>;
}

export interface ElementUpdateData {
  elementId: string;
  properties: Record<string, any>;
}

export interface ArrangementData {
  elementIds: string[];
  direction: "horizontal" | "vertical" | "grid";
  spacing?: number;
  padding?: number;
  alignment?: string;
  columns?: number;
}

export interface AlignmentData {
  nodeIds: string[];
  alignment: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "MIDDLE" | "BOTTOM";
  distributeSpacing?: number;
}

export interface GroupData {
  nodeIds: string[];
  groupName?: string;
}

export interface FlowchartData {
  nodes: Array<{
    id: string;
    type: "start" | "process" | "decision" | "end" | "data";
    text: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
  layout?: "AUTO" | "TOP_TO_BOTTOM" | "LEFT_TO_RIGHT";
  spacing?: { x: number; y: number };
  startPosition?: { x: number; y: number };
}

export interface MindMapData {
  centralTopic: string;
  branches: Array<{
    text: string;
    children?: Array<{ text: string }>;
  }>;
  startPosition?: { x: number; y: number };
  branchSpacing?: number;
}