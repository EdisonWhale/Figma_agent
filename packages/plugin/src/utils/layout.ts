/**
 * Layout Utilities
 * Provides layout calculation functions for arranging elements in various patterns
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface LayoutOptions {
  spacing?: number;
  padding?: number;
  columns?: number;
  alignment?: 'start' | 'center' | 'end';
}

/**
 * Calculate positions for grid layout
 */
export function calculateGridLayout(
  itemCount: number,
  startPosition: Position,
  itemSize: Size,
  options: LayoutOptions = {}
): Position[] {
  const { spacing = 20, columns } = options;
  const cols = columns || Math.ceil(Math.sqrt(itemCount));
  const positions: Position[] = [];

  for (let i = 0; i < itemCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    positions.push({
      x: startPosition.x + col * (itemSize.width + spacing),
      y: startPosition.y + row * (itemSize.height + spacing)
    });
  }

  return positions;
}

/**
 * Calculate positions for row layout (horizontal)
 */
export function calculateRowLayout(
  itemCount: number,
  startPosition: Position,
  itemSize: Size,
  options: LayoutOptions = {}
): Position[] {
  const { spacing = 20 } = options;
  const positions: Position[] = [];

  for (let i = 0; i < itemCount; i++) {
    positions.push({
      x: startPosition.x + i * (itemSize.width + spacing),
      y: startPosition.y
    });
  }

  return positions;
}

/**
 * Calculate positions for column layout (vertical)
 */
export function calculateColumnLayout(
  itemCount: number,
  startPosition: Position,
  itemSize: Size,
  options: LayoutOptions = {}
): Position[] {
  const { spacing = 20 } = options;
  const positions: Position[] = [];

  for (let i = 0; i < itemCount; i++) {
    positions.push({
      x: startPosition.x,
      y: startPosition.y + i * (itemSize.height + spacing)
    });
  }

  return positions;
}

/**
 * Calculate layout positions based on layout type
 */
export function calculateLayout(
  layoutType: 'GRID' | 'ROW' | 'COLUMN',
  itemCount: number,
  startPosition: Position,
  itemSize: Size,
  options: LayoutOptions = {}
): Position[] {
  switch (layoutType) {
    case 'GRID':
      return calculateGridLayout(itemCount, startPosition, itemSize, options);
    case 'ROW':
      return calculateRowLayout(itemCount, startPosition, itemSize, options);
    case 'COLUMN':
      return calculateColumnLayout(itemCount, startPosition, itemSize, options);
    default:
      throw new Error(`Unsupported layout type: ${layoutType}`);
  }
}

/**
 * Calculate optimal grid dimensions for given item count
 */
export function calculateOptimalGridSize(itemCount: number): { rows: number; cols: number } {
  if (itemCount <= 0) return { rows: 0, cols: 0 };
  if (itemCount === 1) return { rows: 1, cols: 1 };
  
  const cols = Math.ceil(Math.sqrt(itemCount));
  const rows = Math.ceil(itemCount / cols);
  
  return { rows, cols };
}

/**
 * Calculate total bounds for a layout
 */
export function calculateLayoutBounds(
  positions: Position[],
  itemSize: Size,
  padding: number = 0
): { x: number; y: number; width: number; height: number } {
  if (positions.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...positions.map(p => p.x)) - padding;
  const minY = Math.min(...positions.map(p => p.y)) - padding;
  const maxX = Math.max(...positions.map(p => p.x + itemSize.width)) + padding;
  const maxY = Math.max(...positions.map(p => p.y + itemSize.height)) + padding;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}