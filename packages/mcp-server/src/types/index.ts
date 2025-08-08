/**
 * Type definitions for MCP server
 */

// Common position and size interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Base tool response interface
export interface ToolResponse {
  action: string;
  data: any;
}

// Color enums for sticky notes and other elements
export type StickyNoteColor = 
  | 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' 
  | 'dark_blue' | 'dark_green' | 'lightRed' | 'lightBlue' | 'lightGreen' 
  | 'gray' | 'lightGray';

// Layout and alignment types
export type LayoutDirection = 'horizontal' | 'vertical' | 'grid';
export type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch';
export type AlignmentType = 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP' | 'MIDDLE' | 'BOTTOM';
export type TextAlign = 'LEFT' | 'CENTER' | 'RIGHT';

// Flowchart and diagram types
export type FlowchartNodeType = 'start' | 'process' | 'decision' | 'end' | 'data';
export type FlowchartLayout = 'TOP_TO_BOTTOM' | 'LEFT_TO_RIGHT' | 'AUTO';

// Shape types
export type ShapeType = 'rectangle' | 'ellipse' | 'polygon' | 'star';

// Connector types
export type ConnectorMagnet = 'AUTO' | 'TOP' | 'RIGHT' | 'BOTTOM' | 'LEFT';
export type StrokeStyle = 'SOLID' | 'DASHED';

// Organization strategies
export type TidyUpStrategy = 'AUTO' | 'GRID' | 'FLOW' | 'CLUSTER';
export type OptimizationStrategy = 'SHORTEST' | 'AVOID_OVERLAPS' | 'MANHATTAN' | 'ORTHOGONAL';

// Chart and visualization types
export type ChartType = 'BAR' | 'LINE' | 'PIE' | 'SCATTER' | 'AREA' | 'DONUT' | 'HISTOGRAM';
export type DiagramType = 'ORG_CHART' | 'NETWORK' | 'TIMELINE' | 'PROCESS_FLOW' | 'HIERARCHY' | 'MATRIX';
export type VisualizationType = 'CUSTOM' | 'DASHBOARD' | 'INFOGRAPHIC' | 'DATA_STORY' | 'COMPARISON' | 'TREND_ANALYSIS';

export type ColorScheme = 'BLUE' | 'GREEN' | 'RED' | 'PURPLE' | 'ORANGE' | 'MULTI';
export type VisualTheme = 'LIGHT' | 'DARK' | 'COLORFUL' | 'MINIMAL';
export type LayoutPattern = 'GRID' | 'FLOW' | 'LAYERED' | 'RADIAL';

// Node and element types for diagrams
export type DiagramNodeType = 'LEADER' | 'MANAGER' | 'EMPLOYEE' | 'PROCESS' | 'DECISION' | 'EVENT' | 'MILESTONE';
export type ConnectionType = 'SOLID' | 'DASHED' | 'DOTTED' | 'ARROW';
export type ElementType = 'CHART' | 'TEXT' | 'ICON' | 'IMAGE' | 'SHAPE' | 'METRIC';

// Layout algorithms for diagrams
export type DiagramLayout = 'TOP_DOWN' | 'LEFT_RIGHT' | 'RADIAL' | 'CIRCULAR' | 'MATRIX' | 'AUTO';

// Resize anchor points
export type ResizeAnchor = 
  | 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' 
  | 'CENTER_LEFT' | 'CENTER' | 'CENTER_RIGHT' 
  | 'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT';

// Batch operation types
export type BatchLayout = 'GRID' | 'ROW' | 'COLUMN';

// Paint object interface (compatible with Figma API)
export interface Paint {
  type: string;
  color?: RGB;
  opacity?: number;
}