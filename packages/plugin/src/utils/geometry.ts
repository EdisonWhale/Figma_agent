/**
 * Geometry Utilities
 * Provides geometric calculation functions for element positioning and alignment
 * Includes position calculations and spatial utilities
 */

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementInfo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate bounding box for multiple elements
 */
export function calculateBounds(elements: ElementInfo[]): Bounds {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...elements.map(el => el.x));
  const minY = Math.min(...elements.map(el => el.y));
  const maxX = Math.max(...elements.map(el => el.x + el.width));
  const maxY = Math.max(...elements.map(el => el.y + el.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate center point of an element
 */
export function calculateCenter(element: ElementInfo): Point {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2
  };
}

/**
 * Calculate center point of multiple elements
 */
export function calculateGroupCenter(elements: ElementInfo[]): Point {
  const bounds = calculateBounds(elements);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
}

/**
 * Calculate alignment positions for elements
 */
export function calculateAlignmentPositions(
  elements: ElementInfo[],
  alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP' | 'MIDDLE' | 'BOTTOM'
): { [elementId: string]: Partial<ElementInfo> } {
  if (elements.length === 0) return {};

  const positions: { [elementId: string]: Partial<ElementInfo> } = {};
  const bounds = calculateBounds(elements);

  switch (alignment) {
    case 'LEFT':
      elements.forEach(el => {
        positions[el.id] = { x: bounds.x };
      });
      break;

    case 'CENTER':
      const centerX = bounds.x + bounds.width / 2;
      elements.forEach(el => {
        positions[el.id] = { x: centerX - el.width / 2 };
      });
      break;

    case 'RIGHT':
      const rightX = bounds.x + bounds.width;
      elements.forEach(el => {
        positions[el.id] = { x: rightX - el.width };
      });
      break;

    case 'TOP':
      elements.forEach(el => {
        positions[el.id] = { y: bounds.y };
      });
      break;

    case 'MIDDLE':
      const centerY = bounds.y + bounds.height / 2;
      elements.forEach(el => {
        positions[el.id] = { y: centerY - el.height / 2 };
      });
      break;

    case 'BOTTOM':
      const bottomY = bounds.y + bounds.height;
      elements.forEach(el => {
        positions[el.id] = { y: bottomY - el.height };
      });
      break;

    default:
      throw new Error(`Unsupported alignment: ${alignment}`);
  }

  return positions;
}

/**
 * Calculate distribution positions for elements
 */
export function calculateDistributionPositions(
  elements: ElementInfo[],
  direction: 'HORIZONTAL' | 'VERTICAL',
  spacing?: number
): { [elementId: string]: Partial<ElementInfo> } {
  if (elements.length <= 1) return {};

  const positions: { [elementId: string]: Partial<ElementInfo> } = {};
  const sortedElements = [...elements];

  if (direction === 'HORIZONTAL') {
    // Sort by x position
    sortedElements.sort((a, b) => a.x - b.x);
    
    if (spacing !== undefined) {
      // Fixed spacing distribution
      let currentX = sortedElements[0].x;
      sortedElements.forEach(el => {
        positions[el.id] = { x: currentX };
        currentX += el.width + spacing;
      });
    } else {
      // Even distribution
      const bounds = calculateBounds(elements);
      const totalElementWidth = sortedElements.reduce((sum, el) => sum + el.width, 0);
      const availableSpace = bounds.width - totalElementWidth;
      const gap = availableSpace / (sortedElements.length - 1);
      
      let currentX = bounds.x;
      sortedElements.forEach(el => {
        positions[el.id] = { x: currentX };
        currentX += el.width + gap;
      });
    }
  } else {
    // Sort by y position
    sortedElements.sort((a, b) => a.y - b.y);
    
    if (spacing !== undefined) {
      // Fixed spacing distribution
      let currentY = sortedElements[0].y;
      sortedElements.forEach(el => {
        positions[el.id] = { y: currentY };
        currentY += el.height + spacing;
      });
    } else {
      // Even distribution
      const bounds = calculateBounds(elements);
      const totalElementHeight = sortedElements.reduce((sum, el) => sum + el.height, 0);
      const availableSpace = bounds.height - totalElementHeight;
      const gap = availableSpace / (sortedElements.length - 1);
      
      let currentY = bounds.y;
      sortedElements.forEach(el => {
        positions[el.id] = { y: currentY };
        currentY += el.height + gap;
      });
    }
  }

  return positions;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates relative position for placing new nodes.
 */
export function calculateRelativePosition(
  targetBounds: { x: number; y: number; width: number; height: number },
  relation: string | null,
  newNodeWidth: number,
  newNodeHeight: number
): { x: number; y: number } {
  const gap = 30; // Default gap
  let x = targetBounds.x;
  let y = targetBounds.y;

  switch (relation?.toUpperCase()) {
    case "RIGHT":
      x = targetBounds.x + targetBounds.width + gap;
      y = targetBounds.y + targetBounds.height / 2 - newNodeHeight / 2; // Align vertically center
      break;
    case "LEFT":
      x = targetBounds.x - newNodeWidth - gap;
      y = targetBounds.y + targetBounds.height / 2 - newNodeHeight / 2; // Align vertically center
      break;
    case "BELOW":
      x = targetBounds.x + targetBounds.width / 2 - newNodeWidth / 2; // Align horizontally center
      y = targetBounds.y + targetBounds.height + gap;
      break;
    case "ABOVE":
      x = targetBounds.x + targetBounds.width / 2 - newNodeWidth / 2; // Align horizontally center
      y = targetBounds.y - newNodeHeight - gap;
      break;
    case "NEAR": // Treat NEAR as RIGHT for now
    default:
      x = targetBounds.x + targetBounds.width + gap;
      y = targetBounds.y + targetBounds.height / 2 - newNodeHeight / 2;
      break;
  }
  console.log(
    `[geometry.ts] Calculated relative position for relation '${relation}': { x: ${x.toFixed(
      0
    )}, y: ${y.toFixed(0)} } based on target bounds:`,
    targetBounds
  );
  return { x, y };
}

/**
 * Check if point is inside bounds
 */
export function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return point.x >= bounds.x && 
         point.x <= bounds.x + bounds.width &&
         point.y >= bounds.y && 
         point.y <= bounds.y + bounds.height;
}

/**
 * Check if two bounds intersect
 */
export function boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
  return !(bounds1.x + bounds1.width < bounds2.x ||
           bounds2.x + bounds2.width < bounds1.x ||
           bounds1.y + bounds1.height < bounds2.y ||
           bounds2.y + bounds2.height < bounds1.y);
}