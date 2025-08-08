/**
 * Batch Operations Utilities
 * Provides utilities for batch operations on Figma elements
 */

export interface BatchResult<T = any> {
  successful: Array<{ id: string; result: T }>;
  failed: Array<{ id: string; error: string }>;
}

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
}

/**
 * Predefined color palette for sticky notes
 */
export const STICKY_COLORS: Record<string, ColorInfo> = {
  yellow: { r: 1, g: 0.9, b: 0.2 },
  blue: { r: 0.2, g: 0.6, b: 1 },
  green: { r: 0.2, g: 0.8, b: 0.4 },
  pink: { r: 1, g: 0.4, b: 0.7 },
  purple: { r: 0.7, g: 0.4, b: 1 },
  red: { r: 1, g: 0.2, b: 0.2 },
  orange: { r: 1, g: 0.6, b: 0.2 },
  dark_blue: { r: 0.1, g: 0.3, b: 0.7 },
  dark_green: { r: 0.1, g: 0.5, b: 0.2 },
  lightRed: { r: 1, g: 0.7, b: 0.7 },
  lightBlue: { r: 0.7, g: 0.9, b: 1 },
  lightGreen: { r: 0.7, g: 1, b: 0.8 },
  gray: { r: 0.5, g: 0.5, b: 0.5 },
  lightGray: { r: 0.8, g: 0.8, b: 0.8 }
};

/**
 * Get color fill object for a color name
 */
export function getColorFill(colorName: string): Paint | null {
  const color = STICKY_COLORS[colorName.toLowerCase()];
  if (!color) return null;

  return {
    type: "SOLID",
    color: color,
  } as Paint;
}

/**
 * Validate color name
 */
export function isValidColorName(colorName: string): boolean {
  return colorName.toLowerCase() in STICKY_COLORS;
}

/**
 * Execute batch operation with error handling
 */
export async function executeBatchOperation<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  getId: (item: T, index: number) => string
): Promise<BatchResult<R>> {
  const result: BatchResult<R> = {
    successful: [],
    failed: []
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = getId(item, i);
    
    try {
      const operationResult = await operation(item, i);
      result.successful.push({ id, result: operationResult });
    } catch (error) {
      result.failed.push({ 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return result;
}

/**
 * Load font with fallback options
 * Note: This function requires the Figma API to be available
 */
export async function loadFontWithFallback(
  fontFamily: string = "Inter", 
  fontStyle: string = "Regular"
): Promise<void> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  try {
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  } catch (error) {
    console.log(`[batch.ts] Font ${fontFamily} ${fontStyle} not available, trying Inter Regular`);
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (error2) {
      console.log("[batch.ts] Inter Regular not available, using Roboto Regular as fallback");
      await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    }
  }
}

/**
 * Generate unique name for element
 */
export function generateElementName(baseName: string, index: number): string {
  return index === 0 ? baseName : `${baseName} ${index + 1}`;
}

/**
 * Validate element position
 */
export function validatePosition(x?: number, y?: number): { x: number; y: number } {
  return {
    x: typeof x === 'number' && !isNaN(x) ? x : 0,
    y: typeof y === 'number' && !isNaN(y) ? y : 0
  };
}

/**
 * Validate element size
 */
export function validateSize(width?: number, height?: number, defaultWidth: number = 100, defaultHeight: number = 100): { width: number; height: number } {
  return {
    width: typeof width === 'number' && width > 0 ? width : defaultWidth,
    height: typeof height === 'number' && height > 0 ? height : defaultHeight
  };
}

/**
 * Create standardized response for batch operations
 */
export function createBatchResponse(
  toolName: string,
  result: BatchResult<any>,
  additionalData?: any
): any {
  return {
    type: "FIGMA_API_RESPONSE",
    success: true,
    result: {
      ...result,
      message: `${toolName}: ${result.successful.length} successful, ${result.failed.length} failed`,
      ...additionalData
    }
  };
}

/**
 * Batch update element properties
 * Note: This function requires the Figma API to be available
 */
export async function batchUpdateElements(
  elementIds: string[],
  updateFn: (node: SceneNode, index: number) => void
): Promise<BatchResult<string>> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  if (elementIds.length === 0) {
    return { successful: [], failed: [] };
  }

  return executeBatchOperation(
    elementIds,
    async (elementId, index) => {
      const node = figma.getNodeById(elementId) as SceneNode;
      if (!node) {
        throw new Error(`Element with ID ${elementId} not found`);
      }
      
      updateFn(node, index);
      return elementId;
    },
    (elementId) => elementId
  );
}