/**
 * Shared utilities for Figma API handlers
 * Eliminates code duplication across handlers
 */

// Color mapping for consistent color handling
export const COLOR_MAP: Record<string, RGB> = {
  yellow: { r: 1, g: 0.9, b: 0.2 },
  blue: { r: 0.2, g: 0.6, b: 1 },
  green: { r: 0.2, g: 0.8, b: 0.4 },
  pink: { r: 1, g: 0.4, b: 0.7 },
  purple: { r: 0.7, g: 0.4, b: 1 },
  red: { r: 1, g: 0.2, b: 0.2 },
};

/**
 * Load font with fallback strategy
 * Tries multiple font combinations before falling back to default
 */
export async function loadFontWithFallback(
  fontFamily: string = "Inter",
  fontStyle: string = "Medium"
): Promise<void> {
  try {
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  } catch (error) {
    console.log(`[handler-utils] ${fontFamily} ${fontStyle} not available, trying Regular`);
    try {
      await figma.loadFontAsync({ family: fontFamily, style: "Regular" });
    } catch (error2) {
      console.log(`[handler-utils] ${fontFamily} Regular not available, using default`);
      await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    }
  }
}

/**
 * Standard response creator for successful operations
 */
export function createSuccessResponse(
  id: string,
  result: any,
  message: string
): void {
  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result,
  });
  console.log(`[handler] ${message}:`, result.elementId || result);
}

/**
 * Standard error response creator
 */
export function createErrorResponse(
  id: string,
  error: Error | string,
  context: string
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error(`[handler] Error in ${context}:`, error);
  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: false,
    error: errorMessage,
  });
}

/**
 * Convert color name to RGB fill
 */
export function getColorFill(colorName: string): Paint | null {
  const color = COLOR_MAP[colorName.toLowerCase()];
  if (!color) {
    console.warn(`[handler-utils] Unsupported color: ${colorName}. Supported: ${Object.keys(COLOR_MAP).join(', ')}`);
    return null;
  }
  return {
    type: "SOLID",
    color: color,
  };
}

/**
 * Apply color to any node that supports fills
 */
export function applyColorToNode(node: any, colorName: string): boolean {
  const colorFill = getColorFill(colorName);
  if (colorFill && 'fills' in node) {
    node.fills = [colorFill];
    return true;
  }
  return false;
}

/**
 * Select and focus on created elements
 */
export function selectAndFocus(nodes: (BaseNode | string)[]): void {
  const validNodes = nodes
    .map(node => typeof node === 'string' ? figma.getNodeById(node) : node)
    .filter(Boolean) as SceneNode[];
    
  if (validNodes.length > 0) {
    figma.currentPage.selection = validNodes;
    figma.viewport.scrollAndZoomIntoView(validNodes);
  }
}

/**
 * Convert node to element info format
 */
export function convertNodeToElement(node: SceneNode): any {
  const element: any = {
    id: node.id,
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: (node as any).rotation || 0,
    opacity: (node as any).opacity || 1,
    visible: node.visible,
    locked: node.locked,
  };

  // Add fills and strokes if available
  if ('fills' in node) {
    element.fills = node.fills;
  }
  if ('strokes' in node) {
    element.strokes = node.strokes;
  }
  if ('effects' in node) {
    element.effects = node.effects;
  }
  if ('cornerRadius' in node) {
    element.cornerRadius = node.cornerRadius;
  }

  // Add text-specific properties
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    element.text = textNode.characters;
    element.fontSize = textNode.fontSize;
    element.fontFamily = textNode.fontName;
  } else if (node.type === 'STICKY') {
    const stickyNode = node as StickyNode;
    element.text = stickyNode.text.characters;
  }

  return element;
}

/**
 * Validate element existence and return node
 */
export function validateAndGetNode(elementId: string, context: string): SceneNode {
  const node = figma.getNodeById(elementId) as SceneNode;
  if (!node) {
    throw new Error(`Element with ID ${elementId} not found in ${context}`);
  }
  return node;
}

/**
 * Traverse and collect nodes recursively
 */
export function traverseAndCollect(
  parent: readonly SceneNode[],
  collector: (node: SceneNode) => any
): any[] {
  const results: any[] = [];
  
  function traverse(node: SceneNode): void {
    results.push(collector(node));
    if ('children' in node) {
      node.children.forEach(child => traverse(child as SceneNode));
    }
  }

  parent.forEach(child => traverse(child as SceneNode));
  return results;
}