/**
 * Schema exports for MCP server tools
 */

// Creation schemas
export {
  CreateStickyNoteSchema,
  CreateRectangleSchema,
  CreateEllipseSchema,
  CreateTextSchema,
  CreateConnectorSchema
} from './creation.js';

// Management schemas
export {
  DeleteElementSchema,
  DeleteElementsSchema,
  UpdateElementSchema,
  SelectElementsSchema,
  DuplicateElementSchema,
  GetElementDetailsSchema,
  QueryElementsSchema
} from './management.js';

// Layout schemas
export {
  ArrangeElementsSchema,
  CreateStickyBatchSchema,
  AlignElementsSchema,
  GroupElementsSchema,
  UngroupElementsSchema
} from './layout.js';

// Advanced creation schemas
export {
  CreateFlowchartSchema,
  CreateMindMapSchema,
  CreateShapeWithTextSchema,
  CreateCodeBlockSchema,
  CreatePolygonSchema,
  CreateStarSchema,
  CreateFrameSchema,
  CreateSectionSchema
} from './advanced.js';

// Operations schemas
export {
  MoveElementSchema,
  ResizeElementSchema,
  RotateElementSchema,
  TidyUpSchema
} from './operations.js';

// Connector management schemas
export {
  UpdateConnectorSchema,
  DeleteConnectorSchema,
  QueryConnectorsSchema,
  OptimizeConnectorPathsSchema
} from './connectors.js';

// Visualization schemas
export {
  CreateChartSchema,
  CreateDiagramSchema,
  CreateVisualizationSchema
} from './visualization.js';