/**
 * Figma API Types
 * Comprehensive type definitions for Figma/FigJam operations
 */

// Core Figma Node Types
export type NodeType = 
  | 'DOCUMENT'
  | 'PAGE'
  | 'FRAME'
  | 'GROUP'
  | 'SECTION'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'POLYGON'
  | 'STAR'
  | 'VECTOR'
  | 'TEXT'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'STICKY'
  | 'CONNECTOR'
  | 'SHAPE_WITH_TEXT'
  | 'CODE_BLOCK'
  | 'STAMP'
  | 'WIDGET'
  | 'EMBED'
  | 'LINK_UNFURL'
  | 'MEDIA';

// Color Types
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

// Paint Types
export type PaintType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';

export interface Paint {
  type: PaintType;
  color?: RGB;
  opacity?: number;
  gradientStops?: ColorStop[];
  gradientTransform?: Transform;
  scaleMode?: string;
  imageHash?: string;
  gifRef?: string;
}

export interface ColorStop {
  position: number;
  color: RGBA;
}

export interface Transform {
  0: readonly [number, number, number];
  1: readonly [number, number, number];
}

// Effect Types
export interface Effect {
  type: string;
  color?: RGBA;
  offset?: Vector;
  radius?: number;
  spread?: number;
  visible?: boolean;
  blendMode?: string;
}

export interface Vector {
  x: number;
  y: number;
}

// Core Element Interface
export interface FigmaElement {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible: boolean;
  locked: boolean;
  parent?: string;
  children?: string[];
  fills?: Paint[];
  strokes?: Paint[];
  effects?: Effect[];
  cornerRadius?: number | number[];
  
  // Text-specific properties
  text?: string;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textColor?: RGB;
  
  // Sticky note specific
  color?: string;
  authorVisible?: boolean;
  
  // Connector specific
  connectorStart?: ConnectorEndpoint;
  connectorEnd?: ConnectorEndpoint;
}

export interface ConnectorEndpoint {
  endpointNodeId: string;
  position: Vector;
}

// Page Information
export interface PageInfo {
  id: string;
  name: string;
  elements: FigmaElement[];
  selection: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  editorType: 'figma' | 'figjam';
}

// Creation Options
export interface BaseCreateOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fills?: Paint[];
  strokes?: Paint[];
  cornerRadius?: number | number[];
  rotation?: number;
  name?: string;
  opacity?: number;
}

export interface ShapeCreateOptions extends BaseCreateOptions {
  // Shape-specific options
}

export interface TextCreateOptions extends BaseCreateOptions {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textColor?: RGB;
  autoResize?: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'NONE';
}

export interface StickyNoteCreateOptions {
  text: string;
  x?: number;
  y?: number;
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green';
  width?: number;
  height?: number;
  authorVisible?: boolean;
}

export interface ConnectorCreateOptions {
  startElementId: string;
  endElementId: string;
  startPosition?: Vector;
  endPosition?: Vector;
  strokeWeight?: number;
  strokeColor?: RGB;
}

// Update Options
export interface ElementUpdateOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  name?: string;
  fills?: Paint[];
  strokes?: Paint[];
  cornerRadius?: number | number[];
  
  // Text-specific updates
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textColor?: RGB;
}

// Query Options
export interface ElementQuery {
  types?: NodeType[];
  names?: string[];
  namePattern?: string;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties?: Partial<FigmaElement>;
}

// API Response Types
export interface FigmaAPIResponse<T = any> {
  type: 'FIGMA_API_RESPONSE';
  id: string;
  success: boolean;
  result?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    action: string;
    duration?: number;
  };
}

export interface ElementCreationResult {
  elementId: string;
  element: FigmaElement;
  message: string;
}

export interface ElementDeletionResult {
  deletedIds: string[];
  message: string;
}

export interface ElementUpdateResult {
  elementId: string;
  updatedProperties: Partial<FigmaElement>;
  message: string;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    elementId: string;
    error: string;
  }>;
  message: string;
}

// Layout and Positioning Types
export interface LayoutOptions {
  direction: 'horizontal' | 'vertical' | 'grid';
  spacing?: number;
  padding?: number;
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  columns?: number; // For grid layout
}

export interface GridPosition {
  row: number;
  column: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Analysis Types
export interface ElementStatistics {
  totalElements: number;
  elementsByType: Record<NodeType, number>;
  selectedCount: number;
  visibleCount: number;
  lockedCount: number;
  totalArea: number;
  boundingBox: BoundingBox;
}

export interface OverlapInfo {
  element1: string;
  element2: string;
  overlapArea: number;
  overlapPercentage: number;
}

export interface DistanceInfo {
  element1: string;
  element2: string;
  distance: number;
  direction: Vector;
}

// Event Types
export interface FigmaEvent {
  type: 'element_created' | 'element_updated' | 'element_deleted' | 'selection_changed' | 'page_changed';
  timestamp: number;
  data: any;
}

export interface ElementEventData {
  elementId: string;
  element?: FigmaElement;
  changes?: Partial<FigmaElement>;
}

export interface SelectionEventData {
  previousSelection: string[];
  currentSelection: string[];
  addedToSelection: string[];
  removedFromSelection: string[];
}

// Cache Types
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cached items
  refreshOnAccess?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Error Types
export class FigmaAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public action?: string,
    public elementId?: string
  ) {
    super(message);
    this.name = 'FigmaAPIError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ElementWithRequired<K extends keyof FigmaElement> = RequiredKeys<FigmaElement, K>;

// Export utility types (keeping file focused on Figma-specific types)