/**
 * Flowchart Creation Utilities
 * Provides utilities for creating flowchart diagrams with automatic layout
 */

import { Position } from './layout';
import { loadFontWithFallback } from './batch';

export interface FlowchartNode {
  id: string;
  text: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'data';
  position?: Position;
}

export interface FlowchartConnection {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartOptions {
  layout?: 'TOP_TO_BOTTOM' | 'LEFT_TO_RIGHT' | 'AUTO';
  spacing?: { x: number; y: number };
  startPosition?: Position;
}

/**
 * Shape configurations for different flowchart node types
 */
export const FLOWCHART_SHAPES = {
  start: { width: 120, height: 60, shape: 'ELLIPSE', color: { r: 0.2, g: 0.8, b: 0.4 } },
  process: { width: 140, height: 80, shape: 'RECTANGLE', color: { r: 0.2, g: 0.6, b: 1 } },
  decision: { width: 120, height: 80, shape: 'DIAMOND', color: { r: 1, g: 0.6, b: 0.2 } },
  end: { width: 120, height: 60, shape: 'ELLIPSE', color: { r: 1, g: 0.2, b: 0.2 } },
  data: { width: 130, height: 70, shape: 'PARALLELOGRAM', color: { r: 0.7, g: 0.4, b: 1 } }
};

/**
 * Calculate optimal layout for flowchart nodes
 */
export function calculateFlowchartLayout(
  nodes: FlowchartNode[],
  _connections: FlowchartConnection[],
  options: FlowchartOptions = {}
): { [nodeId: string]: Position } {
  const { layout = 'AUTO', spacing = { x: 60, y: 60 }, startPosition = { x: 200, y: 200 } } = options;
  
  // Simple layout algorithm - can be enhanced with graph layout algorithms
  const positions: { [nodeId: string]: Position } = {};
  
  if (layout === 'TOP_TO_BOTTOM' || layout === 'AUTO') {
    // Arrange nodes in a simple top-to-bottom flow
    let currentY = startPosition.y;
    let currentX = startPosition.x;
    
    nodes.forEach((node, index) => {
      if (node.position) {
        positions[node.id] = node.position;
      } else {
        positions[node.id] = { x: currentX, y: currentY };
        currentY += FLOWCHART_SHAPES[node.type].height + spacing.y;
        
        // Stagger x position for variety
        if (index % 3 === 0) {
          currentX += spacing.x;
        }
      }
    });
  } else if (layout === 'LEFT_TO_RIGHT') {
    // Arrange nodes in a left-to-right flow
    let currentX = startPosition.x;
    let currentY = startPosition.y;
    
    nodes.forEach((node, index) => {
      if (node.position) {
        positions[node.id] = node.position;
      } else {
        positions[node.id] = { x: currentX, y: currentY };
        currentX += FLOWCHART_SHAPES[node.type].width + spacing.x;
        
        // Stagger y position for variety
        if (index % 3 === 0) {
          currentY += spacing.y;
        }
      }
    });
  }
  
  return positions;
}

/**
 * Create a flowchart shape based on node type
 */
export async function createFlowchartShape(
  nodeType: string,
  text: string,
  position: Position
): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const shapeConfig = FLOWCHART_SHAPES[nodeType as keyof typeof FLOWCHART_SHAPES];
  if (!shapeConfig) {
    throw new Error(`Unknown flowchart node type: ${nodeType}`);
  }

  let shape: SceneNode;

  // Create shape based on type
  switch (shapeConfig.shape) {
    case 'ELLIPSE':
      shape = figma.createEllipse();
      break;
    case 'RECTANGLE':
      shape = figma.createRectangle();
      break;
    case 'DIAMOND':
      // Create diamond using polygon
      shape = figma.createPolygon();
      (shape as PolygonNode).pointCount = 4;
      (shape as PolygonNode).rotation = Math.PI / 4; // 45 degrees
      break;
    case 'PARALLELOGRAM':
      // Create parallelogram using rectangle (Figma doesn't have native parallelogram)
      shape = figma.createRectangle();
      break;
    default:
      shape = figma.createRectangle();
  }

  // Set position and size
  shape.x = position.x;
  shape.y = position.y;
  shape.resize(shapeConfig.width, shapeConfig.height);

  // Set color
  if ('fills' in shape) {
    (shape as any).fills = [{
      type: "SOLID",
      color: shapeConfig.color,
    }];
  }

  // Add text if provided
  if (text) {
    await loadFontWithFallback();
    const textNode = figma.createText();
    textNode.characters = text;
    textNode.fontSize = 14;
    textNode.textAlignHorizontal = 'CENTER';
    textNode.textAlignVertical = 'CENTER';
    
    // Position text in center of shape
    textNode.x = position.x + (shapeConfig.width - textNode.width) / 2;
    textNode.y = position.y + (shapeConfig.height - textNode.height) / 2;
    
    // Group shape and text
    const group = figma.group([shape, textNode], figma.currentPage);
    group.name = `${nodeType}: ${text}`;
    
    return { elementId: group.id, type: nodeType };
  }

  shape.name = `${nodeType}: ${text || 'Untitled'}`;
  return { elementId: shape.id, type: nodeType };
}

/**
 * Create connector between two flowchart nodes
 */
export async function createFlowchartConnector(
  fromElementId: string,
  toElementId: string,
  label?: string
): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  if (figma.editorType !== "figjam") {
    throw new Error("Connectors can only be created in FigJam");
  }

  // Create connector
  const connector = figma.createConnector();
  
  connector.connectorStart = {
    endpointNodeId: fromElementId,
    magnet: "AUTO",
  } as ConnectorEndpoint;
  
  connector.connectorEnd = {
    endpointNodeId: toElementId,
    magnet: "AUTO",
  } as ConnectorEndpoint;

  // Set default styling
  connector.strokeWeight = 2;
  connector.strokes = [{
    type: "SOLID",
    color: { r: 0.2, g: 0.2, b: 0.2 },
  }];

  // Add label if provided
  if (label) {
    await loadFontWithFallback();
    const labelText = figma.createText();
    labelText.characters = label;
    labelText.fontSize = 12;
    
    // Position label near the middle of the connector
    // Note: This is a simple positioning - could be improved with better geometry calculations
    const fromNode = figma.getNodeById(fromElementId);
    const toNode = figma.getNodeById(toElementId);
    
    if (fromNode && toNode) {
      labelText.x = ((fromNode as SceneNode).x + (toNode as SceneNode).x) / 2;
      labelText.y = ((fromNode as SceneNode).y + (toNode as SceneNode).y) / 2 - 10;
    }
    
    const group = figma.group([connector, labelText], figma.currentPage);
    group.name = `Connector: ${label}`;
    
    return { elementId: group.id, type: 'connector' };
  }

  connector.name = `Connector: ${fromElementId} -> ${toElementId}`;
  return { elementId: connector.id, type: 'connector' };
}

/**
 * Calculate bounds for the entire flowchart
 */
export function calculateFlowchartBounds(positions: { [nodeId: string]: Position }): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const nodePositions = Object.values(positions);
  if (nodePositions.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...nodePositions.map(p => p.x));
  const minY = Math.min(...nodePositions.map(p => p.y));
  const maxX = Math.max(...nodePositions.map(p => p.x + 140)); // Assuming max width
  const maxY = Math.max(...nodePositions.map(p => p.y + 80));  // Assuming max height

  return {
    x: minX - 20,
    y: minY - 20,
    width: maxX - minX + 40,
    height: maxY - minY + 40
  };
}