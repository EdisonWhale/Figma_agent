/**
 * Element Management Handlers
 * Handles operations for managing existing elements (delete, update, select, duplicate, arrange)
 */

import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateAndGetNode,
  loadFontWithFallback,
  applyColorToNode,
  selectAndFocus 
} from './utils';
import { ElementUpdateData, ArrangementData } from './types';

/**
 * Delete a single element
 */
export async function handleDeleteElement(id: string, data: { elementId: string }): Promise<void> {
  try {
    const { elementId } = data;
    console.log("[element-management] Deleting element:", elementId);
    
    const node = validateAndGetNode(elementId, "delete operation");
    node.remove();

    const result = {
      deletedIds: [elementId],
      message: `Deleted element: ${elementId}`,
    };

    createSuccessResponse(id, result, "Element deleted successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "delete_element");
    throw error;
  }
}

/**
 * Delete multiple elements
 */
export async function handleDeleteElements(id: string, data: { elementIds: string[] }): Promise<void> {
  try {
    const { elementIds } = data;
    console.log("[element-management] Deleting elements:", elementIds);
    
    const successful: string[] = [];
    const failed: Array<{ elementId: string; error: string }> = [];
    
    elementIds.forEach((elementId: string) => {
      try {
        const node = figma.getNodeById(elementId);
        if (node) {
          node.remove();
          successful.push(elementId);
        } else {
          failed.push({ elementId, error: "Element not found" });
        }
      } catch (error) {
        failed.push({ 
          elementId, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    const result = {
      successful,
      failed,
      message: `Deleted ${successful.length} elements, ${failed.length} failed`,
    };

    createSuccessResponse(id, result, "Bulk deletion completed");
  } catch (error) {
    createErrorResponse(id, error as Error, "delete_elements");
    throw error;
  }
}

/**
 * Update element properties
 */
export async function handleUpdateElement(id: string, data: ElementUpdateData): Promise<void> {
  try {
    const { elementId, properties } = data;
    console.log("[element-management] Updating element:", elementId, properties);
    
    const node = validateAndGetNode(elementId, "update operation");

    // Update basic properties
    if (properties.x !== undefined) node.x = properties.x;
    if (properties.y !== undefined) node.y = properties.y;
    if (properties.width !== undefined && properties.height !== undefined && 'resize' in node) {
      (node as any).resize(properties.width, properties.height);
    }
    if (properties.rotation !== undefined && 'rotation' in node) {
      (node as any).rotation = properties.rotation;
    }
    if (properties.opacity !== undefined && 'opacity' in node) {
      (node as any).opacity = properties.opacity;
    }
    if (properties.visible !== undefined) node.visible = properties.visible;
    if (properties.locked !== undefined) node.locked = properties.locked;
    if (properties.name !== undefined) node.name = properties.name;

    // Update fills and strokes
    if (properties.fills !== undefined && 'fills' in node) {
      (node as any).fills = properties.fills;
    }
    if (properties.strokes !== undefined && 'strokes' in node) {
      (node as any).strokes = properties.strokes;
    }

    // Update corner radius for shapes that support it
    if (properties.cornerRadius !== undefined && 'cornerRadius' in node) {
      (node as any).cornerRadius = properties.cornerRadius;
    }

    // Update color property (convert color name to fills)
    if (properties.color !== undefined) {
      const success = applyColorToNode(node, properties.color);
      if (success) {
        console.log(`[element-management] Updated element color to ${properties.color}`);
      }
    }

    // Update text-specific properties
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      if (properties.text !== undefined) {
        textNode.characters = properties.text;
      }
      if (properties.fontSize !== undefined) {
        textNode.fontSize = properties.fontSize;
      }
      if (properties.textAlign !== undefined) {
        textNode.textAlignHorizontal = properties.textAlign;
      }
      if (properties.textColor !== undefined) {
        textNode.fills = [{
          type: "SOLID",
          color: properties.textColor,
        }];
      }
    }

    // Update sticky note specific properties
    if (node.type === 'STICKY') {
      const stickyNode = node as StickyNode;
      if (properties.text !== undefined) {
        // Load font before updating text content
        await loadFontWithFallback();
        stickyNode.text.characters = properties.text;
      }
    }

    const result = {
      elementId,
      updatedProperties: properties,
      message: `Updated element: ${elementId}`,
    };

    createSuccessResponse(id, result, "Element updated successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "update_element");
    throw error;
  }
}

/**
 * Select elements
 */
export async function handleSelectElements(id: string, data: { elementIds: string[] }): Promise<void> {
  try {
    const { elementIds } = data;
    console.log("[element-management] Selecting elements:", elementIds);
    
    const nodes: SceneNode[] = [];
    
    elementIds.forEach((elementId: string) => {
      const node = figma.getNodeById(elementId) as SceneNode;
      if (node) {
        nodes.push(node);
      }
    });

    figma.currentPage.selection = nodes;
    
    if (nodes.length > 0) {
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    const result = {
      selectedIds: nodes.map(n => n.id),
      message: `Selected ${nodes.length} elements`,
    };

    createSuccessResponse(id, result, "Elements selected");
  } catch (error) {
    createErrorResponse(id, error as Error, "select_elements");
    throw error;
  }
}

/**
 * Duplicate an element
 */
export async function handleDuplicateElement(id: string, data: { elementId: string; offsetX?: number; offsetY?: number }): Promise<void> {
  try {
    const { elementId, offsetX, offsetY } = data;
    console.log("[element-management] Duplicating element:", elementId);
    
    const node = validateAndGetNode(elementId, "duplicate operation");

    const duplicate = (node as any).clone();
    duplicate.x = node.x + (offsetX || 20);
    duplicate.y = node.y + (offsetY || 20);

    // Add to same parent as original
    if (node.parent) {
      node.parent.appendChild(duplicate);
    }

    // Select and focus the duplicate
    selectAndFocus([duplicate]);

    const result = {
      elementId: duplicate.id,
      message: `Duplicated element: ${elementId} -> ${duplicate.id}`,
    };

    createSuccessResponse(id, result, "Element duplicated successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "duplicate_element");
    throw error;
  }
}

/**
 * Arrange elements in layout
 */
export async function handleArrangeElements(id: string, data: ArrangementData): Promise<void> {
  try {
    const { elementIds, direction, spacing, padding, alignment, columns } = data;
    console.log("[element-management] Arranging elements:", elementIds, direction);
    
    const nodes = elementIds.map((elementId: string) => {
      return figma.getNodeById(elementId) as SceneNode;
    }).filter(Boolean);

    if (nodes.length === 0) {
      throw new Error("No valid elements found to arrange");
    }

    const spacingValue = spacing || 10;
    const paddingValue = padding || 0;
    
    if (direction === "horizontal") {
      let currentX = paddingValue;
      nodes.forEach((node: SceneNode, index: number) => {
        if (index > 0) {
          currentX += spacingValue;
        }
        node.x = currentX;
        currentX += node.width;
      });
    } else if (direction === "vertical") {
      let currentY = paddingValue;
      nodes.forEach((node: SceneNode, index: number) => {
        if (index > 0) {
          currentY += spacingValue;
        }
        node.y = currentY;
        currentY += node.height;
      });
    } else if (direction === "grid") {
      const cols = columns || Math.ceil(Math.sqrt(nodes.length));
      nodes.forEach((node: SceneNode, index: number) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        node.x = paddingValue + col * (node.width + spacingValue);
        node.y = paddingValue + row * (node.height + spacingValue);
      });
    }

    // Select all arranged elements
    selectAndFocus(nodes);

    const result = {
      successful: elementIds,
      failed: [],
      message: `Arranged ${nodes.length} elements in ${direction} layout`,
    };

    createSuccessResponse(id, result, "Elements arranged successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "arrange_elements");
    throw error;
  }
}