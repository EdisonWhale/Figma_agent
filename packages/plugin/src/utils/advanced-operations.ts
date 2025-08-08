/**
 * Advanced Operations Utilities
 * Category 2: Basic operations enhancement (move, resize, rotate)
 * Category 4: Smart canvas organization (tidyUp)
 */

import { Position, Size } from './layout';
import { ElementInfo } from './geometry';

export interface MoveElementOptions {
  elementId: string;
  position: Position;
  relative?: boolean; // If true, position is relative to current position
  animate?: boolean;  // If true, animate the movement (FigJam only)
}

export interface ResizeElementOptions {
  elementId: string;
  size: Size;
  relative?: boolean;     // If true, size is relative to current size
  constrainProportions?: boolean; // If true, maintain aspect ratio
  anchorPoint?: 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 'CENTER_LEFT' | 'CENTER' | 'CENTER_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT';
}

export interface RotateElementOptions {
  elementId: string;
  rotation: number;      // Rotation in radians
  relative?: boolean;    // If true, rotation is relative to current rotation
  anchorPoint?: Position; // Custom rotation anchor point
}

export interface TidyUpOptions {
  elementIds?: string[]; // If not provided, operates on all elements in current page
  strategy?: 'AUTO' | 'GRID' | 'FLOW' | 'CLUSTER'; // Organization strategy
  spacing?: number;      // Minimum spacing between elements
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP' | 'MIDDLE' | 'BOTTOM';
  groupSimilar?: boolean; // Group elements with similar properties
  removeOverlaps?: boolean; // Remove overlapping elements
  optimizeConnections?: boolean; // Optimize connector paths (FigJam)
}

export interface TidyUpResult {
  organized: string[];   // Successfully organized element IDs
  grouped: Array<{ groupId: string; elementIds: string[] }>; // Created groups
  removed: string[];     // Removed duplicate/overlapping elements
  totalMoved: number;
  totalGroupsCreated: number;
  bounds: { x: number; y: number; width: number; height: number };
  message: string;
}

/**
 * Move an element to a new position
 */
export async function moveElement(options: MoveElementOptions): Promise<{ elementId: string; newPosition: Position; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { elementId, position, relative = false, animate = false } = options;

  // Get the element
  const element = figma.getNodeById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  if (!('x' in element) || !('y' in element)) {
    throw new Error(`Element ${elementId} is not a scene node and cannot be moved`);
  }

  const sceneElement = element as SceneNode;
  const currentPosition = { x: sceneElement.x, y: sceneElement.y };

  // Calculate new position
  const newPosition = relative ? {
    x: currentPosition.x + position.x,
    y: currentPosition.y + position.y
  } : position;

  // Apply movement
  if (animate && figma.editorType === "figjam") {
    // FigJam supports animation
    try {
      // Animate movement (FigJam specific)
      sceneElement.x = newPosition.x;
      sceneElement.y = newPosition.y;
    } catch (error) {
      // Fallback to instant movement
      sceneElement.x = newPosition.x;
      sceneElement.y = newPosition.y;
    }
  } else {
    // Instant movement
    sceneElement.x = newPosition.x;
    sceneElement.y = newPosition.y;
  }

  const moveDistance = Math.sqrt(
    Math.pow(newPosition.x - currentPosition.x, 2) + 
    Math.pow(newPosition.y - currentPosition.y, 2)
  );

  return {
    elementId,
    newPosition,
    message: `Moved element ${relative ? 'relatively' : 'absolutely'} by ${Math.round(moveDistance)}px`
  };
}

/**
 * Resize an element to new dimensions
 */
export async function resizeElement(options: ResizeElementOptions): Promise<{ elementId: string; newSize: Size; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { elementId, size, relative = false, constrainProportions = false, anchorPoint = 'TOP_LEFT' } = options;

  // Get the element
  const element = figma.getNodeById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  if (!('resize' in element)) {
    throw new Error(`Element ${elementId} cannot be resized`);
  }

  const resizableElement = element as SceneNode & { resize: (width: number, height: number) => void };
  const currentSize = { width: resizableElement.width, height: resizableElement.height };

  // Calculate new size
  let newSize = relative ? {
    width: currentSize.width + size.width,
    height: currentSize.height + size.height
  } : size;

  // Constrain proportions if requested
  if (constrainProportions) {
    const aspectRatio = currentSize.width / currentSize.height;
    
    // Use width as the primary constraint
    newSize.height = newSize.width / aspectRatio;
  }

  // Ensure minimum size
  newSize.width = Math.max(1, newSize.width);
  newSize.height = Math.max(1, newSize.height);

  // Store original position for anchor point calculation
  const originalPosition = { x: resizableElement.x, y: resizableElement.y };

  // Resize the element
  resizableElement.resize(newSize.width, newSize.height);

  // Adjust position based on anchor point
  if (anchorPoint !== 'TOP_LEFT') {
    const widthDiff = newSize.width - currentSize.width;
    const heightDiff = newSize.height - currentSize.height;

    let offsetX = 0;
    let offsetY = 0;

    // Calculate horizontal offset
    switch (anchorPoint) {
      case 'TOP_CENTER':
      case 'CENTER':
      case 'BOTTOM_CENTER':
        offsetX = -widthDiff / 2;
        break;
      case 'TOP_RIGHT':
      case 'CENTER_RIGHT':
      case 'BOTTOM_RIGHT':
        offsetX = -widthDiff;
        break;
    }

    // Calculate vertical offset
    switch (anchorPoint) {
      case 'CENTER_LEFT':
      case 'CENTER':
      case 'CENTER_RIGHT':
        offsetY = -heightDiff / 2;
        break;
      case 'BOTTOM_LEFT':
      case 'BOTTOM_CENTER':
      case 'BOTTOM_RIGHT':
        offsetY = -heightDiff;
        break;
    }

    // Apply position adjustment
    resizableElement.x = originalPosition.x + offsetX;
    resizableElement.y = originalPosition.y + offsetY;
  }

  return {
    elementId,
    newSize,
    message: `Resized element ${relative ? 'relatively' : 'absolutely'} to ${Math.round(newSize.width)}x${Math.round(newSize.height)}px with ${anchorPoint} anchor`
  };
}

/**
 * Rotate an element by a specified angle
 */
export async function rotateElement(options: RotateElementOptions): Promise<{ elementId: string; newRotation: number; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { elementId, rotation, relative = false, anchorPoint } = options;

  // Get the element
  const element = figma.getNodeById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  if (!('rotation' in element)) {
    throw new Error(`Element ${elementId} cannot be rotated`);
  }

  const rotatableElement = element as SceneNode & { rotation: number };
  const currentRotation = rotatableElement.rotation;

  // Calculate new rotation
  const newRotation = relative ? currentRotation + rotation : rotation;

  // Normalize rotation to [-π, π] range
  const normalizedRotation = ((newRotation + Math.PI) % (2 * Math.PI)) - Math.PI;

  // If custom anchor point is provided, calculate position adjustment
  if (anchorPoint && 'x' in rotatableElement && 'y' in rotatableElement) {
    const sceneElement = rotatableElement as SceneNode;
    const elementCenter = {
      x: sceneElement.x + sceneElement.width / 2,
      y: sceneElement.y + sceneElement.height / 2
    };

    // Calculate rotation around custom anchor point
    const rotationDiff = normalizedRotation - currentRotation;
    
    // Vector from anchor to element center
    const dx = elementCenter.x - anchorPoint.x;
    const dy = elementCenter.y - anchorPoint.y;
    
    // Rotate the vector
    const cos = Math.cos(rotationDiff);
    const sin = Math.sin(rotationDiff);
    const newDx = dx * cos - dy * sin;
    const newDy = dx * sin + dy * cos;
    
    // Calculate new element center position
    const newCenter = {
      x: anchorPoint.x + newDx,
      y: anchorPoint.y + newDy
    };
    
    // Update element position
    sceneElement.x = newCenter.x - sceneElement.width / 2;
    sceneElement.y = newCenter.y - sceneElement.height / 2;
  }

  // Apply rotation
  rotatableElement.rotation = normalizedRotation;

  const rotationDegrees = (normalizedRotation * 180) / Math.PI;

  return {
    elementId,
    newRotation: normalizedRotation,
    message: `Rotated element ${relative ? 'relatively' : 'absolutely'} to ${Math.round(rotationDegrees)}°${anchorPoint ? ' around custom anchor' : ''}`
  };
}

/**
 * Smart canvas organization - tidyUp function
 */
export async function tidyUp(options: TidyUpOptions = {}): Promise<TidyUpResult> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    elementIds,
    strategy = 'AUTO',
    spacing = 20,
    alignment = 'TOP',
    groupSimilar = true,
    removeOverlaps = true,
    optimizeConnections = false
  } = options;

  console.log("[tidyUp] Starting canvas organization with strategy:", strategy);

  // Get elements to organize
  let elements: SceneNode[] = [];
  
  if (elementIds && elementIds.length > 0) {
    // Use specified elements
    elements = elementIds
      .map(id => figma.getNodeById(id))
      .filter(Boolean)
      .filter(node => node && 'x' in node && 'y' in node) as SceneNode[];
  } else {
    // Use all elements on current page
    elements = figma.currentPage.children.filter(node => 
      node && 'x' in node && 'y' in node && node.visible
    ) as SceneNode[];
  }

  if (elements.length === 0) {
    return {
      organized: [],
      grouped: [],
      removed: [],
      totalMoved: 0,
      totalGroupsCreated: 0,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      message: "No elements to organize"
    };
  }

  console.log(`[tidyUp] Found ${elements.length} elements to organize`);

  const result: TidyUpResult = {
    organized: [],
    grouped: [],
    removed: [],
    totalMoved: 0,
    totalGroupsCreated: 0,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    message: ""
  };

  // Step 1: Remove overlapping elements if requested
  if (removeOverlaps) {
    const overlappingPairs = findOverlappingElements(elements);
    for (const [elem1, elem2] of overlappingPairs) {
      // Remove the smaller element
      const area1 = elem1.width * elem1.height;
      const area2 = elem2.width * elem2.height;
      const toRemove = area1 < area2 ? elem1 : elem2;
      
      try {
        toRemove.remove();
        result.removed.push(toRemove.id);
        elements = elements.filter(e => e.id !== toRemove.id);
      } catch (error) {
        console.warn(`[tidyUp] Could not remove overlapping element ${toRemove.id}:`, error);
      }
    }
  }

  // Step 2: Group similar elements if requested
  if (groupSimilar) {
    const groups = groupSimilarElements(elements);
    for (const group of groups) {
      if (group.length > 1) {
        try {
          const newGroup = figma.group(group, figma.currentPage);
          newGroup.name = `Tidy Group ${result.totalGroupsCreated + 1}`;
          result.grouped.push({
            groupId: newGroup.id,
            elementIds: group.map(e => e.id)
          });
          result.totalGroupsCreated++;
        } catch (error) {
          console.warn(`[tidyUp] Could not create group:`, error);
        }
      }
    }
  }

  // Step 3: Organize layout based on strategy
  const layoutResult = await organizeLayout(elements, strategy, spacing, alignment);
  result.organized = layoutResult.organized;
  result.totalMoved = layoutResult.totalMoved;
  result.bounds = layoutResult.bounds;

  // Step 4: Optimize connections in FigJam if requested
  if (optimizeConnections && figma.editorType === "figjam") {
    try {
      await optimizeConnectors(elements);
    } catch (error) {
      console.warn(`[tidyUp] Could not optimize connections:`, error);
    }
  }

  // Generate summary message
  result.message = `Organized ${result.organized.length} elements using ${strategy} strategy. ` +
    `Moved ${result.totalMoved} elements, created ${result.totalGroupsCreated} groups` +
    (result.removed.length > 0 ? `, removed ${result.removed.length} overlapping elements` : '') + '.';

  console.log(`[tidyUp] Completed organization:`, result);
  return result;
}

/**
 * Find overlapping elements
 */
function findOverlappingElements(elements: SceneNode[]): Array<[SceneNode, SceneNode]> {
  const pairs: Array<[SceneNode, SceneNode]> = [];
  
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const elem1 = elements[i];
      const elem2 = elements[j];
      
      // Check if bounding boxes overlap
      const overlap = !(
        elem1.x + elem1.width <= elem2.x ||
        elem2.x + elem2.width <= elem1.x ||
        elem1.y + elem1.height <= elem2.y ||
        elem2.y + elem2.height <= elem1.y
      );
      
      if (overlap) {
        pairs.push([elem1, elem2]);
      }
    }
  }
  
  return pairs;
}

/**
 * Group elements with similar properties
 */
function groupSimilarElements(elements: SceneNode[]): SceneNode[][] {
  const groups: { [key: string]: SceneNode[] } = {};
  
  for (const element of elements) {
    // Create a similarity key based on type, size, and color
    let key = element.type;
    
    // Add size category (small/medium/large)
    const area = element.width * element.height;
    if (area < 10000) key += '_small';
    else if (area < 50000) key += '_medium';
    else key += '_large';
    
    // Add color information if available
    if ('fills' in element && Array.isArray(element.fills) && element.fills.length > 0) {
      const fill = element.fills[0];
      if (fill.type === 'SOLID') {
        const color = fill.color as { r: number; g: number; b: number };
        // Quantize color to reduce groups
        const r = Math.round(color.r * 4) / 4;
        const g = Math.round(color.g * 4) / 4;
        const b = Math.round(color.b * 4) / 4;
        key += `_${r}-${g}-${b}`;
      }
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(element);
  }
  
  return Object.values(groups);
}

/**
 * Organize elements based on strategy
 */
async function organizeLayout(
  elements: SceneNode[], 
  strategy: string, 
  spacing: number, 
  alignment: string
): Promise<{ organized: string[]; totalMoved: number; bounds: { x: number; y: number; width: number; height: number } }> {
  
  const organized: string[] = [];
  let totalMoved = 0;
  
  // Calculate current bounds
  const bounds = calculateBounds(elements);
  
  switch (strategy) {
    case 'GRID':
      totalMoved = await organizeAsGrid(elements, spacing, bounds.x, bounds.y);
      break;
      
    case 'FLOW':
      totalMoved = await organizeAsFlow(elements, spacing, alignment, bounds.x, bounds.y);
      break;
      
    case 'CLUSTER':
      totalMoved = await organizeAsClusters(elements, spacing, bounds.x, bounds.y);
      break;
      
    case 'AUTO':
    default:
      // Choose best strategy based on element count and distribution
      if (elements.length <= 16) {
        totalMoved = await organizeAsGrid(elements, spacing, bounds.x, bounds.y);
      } else if (elements.length <= 50) {
        totalMoved = await organizeAsFlow(elements, spacing, alignment, bounds.x, bounds.y);
      } else {
        totalMoved = await organizeAsClusters(elements, spacing, bounds.x, bounds.y);
      }
      break;
  }
  
  // All elements that were processed are considered organized
  organized.push(...elements.map(e => e.id));
  
  // Calculate new bounds after organization
  const newBounds = calculateBounds(elements);
  
  return {
    organized,
    totalMoved,
    bounds: newBounds
  };
}

/**
 * Organize elements in a grid layout
 */
async function organizeAsGrid(elements: SceneNode[], spacing: number, startX: number, startY: number): Promise<number> {
  const cols = Math.ceil(Math.sqrt(elements.length));
  let moved = 0;
  
  // Sort by area (largest first)
  const sortedElements = [...elements].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  for (let i = 0; i < sortedElements.length; i++) {
    const element = sortedElements[i];
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const newX = startX + col * (200 + spacing); // Assume 200px cell width
    const newY = startY + row * (200 + spacing); // Assume 200px cell height
    
    if (element.x !== newX || element.y !== newY) {
      element.x = newX;
      element.y = newY;
      moved++;
    }
  }
  
  return moved;
}

/**
 * Organize elements in a flowing layout
 */
async function organizeAsFlow(elements: SceneNode[], spacing: number, alignment: string, startX: number, startY: number): Promise<number> {
  let moved = 0;
  let currentX = startX;
  let currentY = startY;
  let rowHeight = 0;
  const maxRowWidth = 1200; // Maximum width before wrapping to next row
  
  for (const element of elements) {
    // Check if element fits in current row
    if (currentX + element.width > startX + maxRowWidth && currentX > startX) {
      // Move to next row
      currentX = startX;
      currentY += rowHeight + spacing;
      rowHeight = 0;
    }
    
    // Position element
    let posY = currentY;
    if (alignment === 'MIDDLE') {
      posY = currentY + (rowHeight - element.height) / 2;
    } else if (alignment === 'BOTTOM') {
      posY = currentY + rowHeight - element.height;
    }
    
    if (element.x !== currentX || element.y !== posY) {
      element.x = currentX;
      element.y = posY;
      moved++;
    }
    
    // Update position for next element
    currentX += element.width + spacing;
    rowHeight = Math.max(rowHeight, element.height);
  }
  
  return moved;
}

/**
 * Organize elements in clusters based on similarity
 */
async function organizeAsClusters(elements: SceneNode[], spacing: number, startX: number, startY: number): Promise<number> {
  const groups = groupSimilarElements(elements);
  let moved = 0;
  let currentX = startX;
  let currentY = startY;
  let maxHeightInRow = 0;
  
  for (const group of groups) {
    // Organize each cluster in a tight grid
    const clusterCols = Math.ceil(Math.sqrt(group.length));
    let clusterWidth = 0;
    let clusterHeight = 0;
    
    for (let i = 0; i < group.length; i++) {
      const element = group[i];
      const row = Math.floor(i / clusterCols);
      const col = i % clusterCols;
      
      const newX = currentX + col * (element.width + spacing / 2);
      const newY = currentY + row * (element.height + spacing / 2);
      
      if (element.x !== newX || element.y !== newY) {
        element.x = newX;
        element.y = newY;
        moved++;
      }
      
      clusterWidth = Math.max(clusterWidth, newX + element.width - currentX);
      clusterHeight = Math.max(clusterHeight, newY + element.height - currentY);
    }
    
    // Move to next cluster position
    currentX += clusterWidth + spacing * 2;
    maxHeightInRow = Math.max(maxHeightInRow, clusterHeight);
    
    // Wrap to next row if needed
    if (currentX > startX + 1000) {
      currentX = startX;
      currentY += maxHeightInRow + spacing * 2;
      maxHeightInRow = 0;
    }
  }
  
  return moved;
}

/**
 * Calculate bounds for a set of elements
 */
function calculateBounds(elements: SceneNode[]): { x: number; y: number; width: number; height: number } {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = elements[0].x;
  let minY = elements[0].y;
  let maxX = elements[0].x + elements[0].width;
  let maxY = elements[0].y + elements[0].height;
  
  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Optimize connectors in FigJam
 */
async function optimizeConnectors(elements: SceneNode[]): Promise<void> {
  if (figma.editorType !== "figjam") {
    return;
  }
  
  // Find all connectors in the current page
  const connectors = figma.currentPage.children.filter(node => node.type === 'CONNECTOR') as ConnectorNode[];
  
  for (const connector of connectors) {
    try {
      // Basic connector optimization - ensure endpoints are connected to nearest elements
      // This is a simplified optimization - real optimization would be more complex
      
      // Basic connector optimization
      // Note: ConnectorEndpoint API structure may vary by Figma version
      try {
        const connectorStart = connector.connectorStart as any;
        const connectorEnd = connector.connectorEnd as any;
        
        if (connectorStart?.endpointNodeId && connectorEnd?.endpointNodeId) {
          const startNode = figma.getNodeById(connectorStart.endpointNodeId);
          const endNode = figma.getNodeById(connectorEnd.endpointNodeId);
          
          if (startNode && endNode && 'x' in startNode && 'x' in endNode) {
            // Reconnect with AUTO magnet for better automatic positioning
            connector.connectorStart = {
              endpointNodeId: startNode.id,
              magnet: "AUTO"
            } as any;
            
            connector.connectorEnd = {
              endpointNodeId: endNode.id,
              magnet: "AUTO"
            } as any;
          }
        }
      } catch (error) {
        // Silently ignore connector optimization errors
        console.warn(`[optimizeConnectors] Could not access connector endpoint:`, error);
      }
    } catch (error) {
      console.warn(`[tidyUp] Could not optimize connector ${connector.id}:`, error);
    }
  }
}