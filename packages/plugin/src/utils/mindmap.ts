/**
 * Mind Map Creation Utilities
 * Provides utilities for creating mind map diagrams with radial layout
 */

import { Position, Size } from './layout';
import { getColorFill, loadFontWithFallback } from './batch';

export interface MindMapBranch {
  text: string;
  children?: Array<{ text: string }>;
  color?: string;
}

export interface MindMapOptions {
  startPosition?: Position;
  branchSpacing?: number;
  levelSpacing?: number;
  centralNodeSize?: Size;
  branchNodeSize?: Size;
}

/**
 * Calculate radial positions for mind map nodes
 */
export function calculateMindMapLayout(
  centralTopic: string,
  branches: MindMapBranch[],
  options: MindMapOptions = {}
): {
  central: Position;
  branches: Array<{ 
    position: Position; 
    text: string; 
    color?: string;
    children: Array<{ position: Position; text: string }>;
  }>;
} {
  const {
    startPosition = { x: 400, y: 300 },
    branchSpacing = 100,
    levelSpacing = 150,
    centralNodeSize = { width: 160, height: 80 },
    branchNodeSize = { width: 120, height: 60 }
  } = options;

  const layout = {
    central: startPosition,
    branches: [] as any[]
  };

  // Calculate branch positions in a radial pattern
  const angleStep = (2 * Math.PI) / branches.length;
  
  branches.forEach((branch, index) => {
    const angle = index * angleStep;
    
    // Position main branch node
    const branchPosition = {
      x: startPosition.x + Math.cos(angle) * levelSpacing,
      y: startPosition.y + Math.sin(angle) * levelSpacing
    };

    const branchLayout = {
      position: branchPosition,
      text: branch.text,
      color: branch.color,
      children: [] as Array<{ position: Position; text: string }>
    };

    // Position child nodes around the branch
    if (branch.children && branch.children.length > 0) {
      const childAngleStep = Math.PI / Math.max(branch.children.length, 2);
      const baseChildAngle = angle - (Math.PI / 2);

      branch.children.forEach((child, childIndex) => {
        const childAngle = baseChildAngle + childIndex * childAngleStep;
        const childPosition = {
          x: branchPosition.x + Math.cos(childAngle) * branchSpacing,
          y: branchPosition.y + Math.sin(childAngle) * branchSpacing
        };

        branchLayout.children.push({
          position: childPosition,
          text: child.text
        });
      });
    }

    layout.branches.push(branchLayout);
  });

  return layout;
}

/**
 * Create a mind map node (central topic or branch)
 */
export async function createMindMapNode(
  text: string,
  position: Position,
  nodeType: 'central' | 'branch' | 'child',
  color?: string
): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  // Load font first
  await loadFontWithFallback();

  // Create text node
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.fontSize = nodeType === 'central' ? 18 : nodeType === 'branch' ? 14 : 12;
  try {
    textNode.fontName = { 
      family: 'Inter', 
      style: nodeType === 'central' ? 'Bold' : 'Medium' 
    };
  } catch (error) {
    textNode.fontName = { family: 'Inter', style: 'Regular' };
  }
  textNode.textAlignHorizontal = 'CENTER';
  textNode.textAlignVertical = 'CENTER';

  // Set text position
  textNode.x = position.x;
  textNode.y = position.y;

  // Create background shape based on node type
  let backgroundShape: SceneNode;
  let size: Size;

  switch (nodeType) {
    case 'central':
      backgroundShape = figma.createEllipse();
      size = { width: 160, height: 80 };
      if ('fills' in backgroundShape) {
        const fillColor = color ? getColorFill(color) : null;
        (backgroundShape as any).fills = [{
          type: "SOLID",
          color: fillColor?.type === "SOLID" ? (fillColor as any).color : { r: 0.9, g: 0.9, b: 0.2 },
        }];
      }
      break;
    case 'branch':
      backgroundShape = figma.createRectangle();
      (backgroundShape as RectangleNode).cornerRadius = 20;
      size = { width: 120, height: 60 };
      if ('fills' in backgroundShape) {
        const fillColor = color ? getColorFill(color) : null;
        (backgroundShape as any).fills = [{
          type: "SOLID",
          color: fillColor?.type === "SOLID" ? (fillColor as any).color : { r: 0.7, g: 0.8, b: 1 },
        }];
      }
      break;
    case 'child':
      backgroundShape = figma.createRectangle();
      (backgroundShape as RectangleNode).cornerRadius = 15;
      size = { width: 100, height: 40 };
      if ('fills' in backgroundShape) {
        (backgroundShape as any).fills = [{
          type: "SOLID",
          color: { r: 0.95, g: 0.95, b: 0.95 },
        }];
      }
      break;
    default:
      backgroundShape = figma.createRectangle();
      size = { width: 120, height: 60 };
  }

  // Position and size background
  backgroundShape.x = position.x - size.width / 2;
  backgroundShape.y = position.y - size.height / 2;
  backgroundShape.resize(size.width, size.height);

  // Center text on background
  textNode.x = backgroundShape.x + (size.width - textNode.width) / 2;
  textNode.y = backgroundShape.y + (size.height - textNode.height) / 2;

  // Group background and text
  const group = figma.group([backgroundShape, textNode], figma.currentPage);
  group.name = `${nodeType}: ${text}`;

  return { elementId: group.id, type: nodeType };
}

/**
 * Create connector line between mind map nodes
 */
export async function createMindMapConnector(
  fromElementId: string,
  toElementId: string,
  style: 'curved' | 'straight' = 'curved'
): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  if (figma.editorType !== "figjam") {
    // In regular Figma, create a simple line using vector
    const fromNode = figma.getNodeById(fromElementId);
    const toNode = figma.getNodeById(toElementId);
    
    if (!fromNode || !toNode) {
      throw new Error("Source or target node not found");
    }

    // Create a simple line using rectangle (as a workaround)
    const line = figma.createRectangle();
    const fromSceneNode = fromNode as SceneNode;
    const toSceneNode = toNode as SceneNode;
    line.resize(Math.abs(toSceneNode.x - fromSceneNode.x), 2);
    line.x = Math.min(fromSceneNode.x, toSceneNode.x);
    line.y = (fromSceneNode.y + toSceneNode.y) / 2;
    
    if ('fills' in line) {
      (line as any).fills = [{
        type: "SOLID",
        color: { r: 0.3, g: 0.3, b: 0.3 },
      }];
    }

    line.name = `Connector: ${fromElementId} -> ${toElementId}`;
    return { elementId: line.id, type: 'connector' };
  } else {
    // In FigJam, use native connector
    const connector = figma.createConnector();
    
    connector.connectorStart = {
      endpointNodeId: fromElementId,
      magnet: "AUTO",
    } as ConnectorEndpoint;
    
    connector.connectorEnd = {
      endpointNodeId: toElementId,
      magnet: "AUTO",
    } as ConnectorEndpoint;

    // Style the connector
    connector.strokeWeight = 2;
    connector.strokes = [{
      type: "SOLID",
      color: { r: 0.3, g: 0.3, b: 0.3 },
    }];

    connector.name = `MindMap Connector: ${fromElementId} -> ${toElementId}`;
    return { elementId: connector.id, type: 'connector' };
  }
}

/**
 * Calculate total bounds for the mind map
 */
export function calculateMindMapBounds(layout: {
  central: Position;
  branches: Array<{ 
    position: Position; 
    children: Array<{ position: Position; text: string }>;
  }>;
}): { x: number; y: number; width: number; height: number } {
  const positions = [
    layout.central,
    ...layout.branches.map(b => b.position),
    ...layout.branches.flatMap(b => b.children.map(c => c.position))
  ];

  if (positions.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...positions.map(p => p.x)) - 100;
  const minY = Math.min(...positions.map(p => p.y)) - 50;
  const maxX = Math.max(...positions.map(p => p.x)) + 100;
  const maxY = Math.max(...positions.map(p => p.y)) + 50;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}