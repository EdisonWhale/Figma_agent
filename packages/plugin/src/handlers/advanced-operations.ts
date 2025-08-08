/**
 * Advanced Operations Handlers
 * Handles Category 2 & 4 operations: move, resize, rotate, tidyUp
 */

import { moveElement, resizeElement, rotateElement, tidyUp } from '../utils/advanced-operations';

/**
 * Handle move element request
 */
export async function handleMoveElement(id: string, data: any): Promise<void> {
  const { elementId, position, relative, animate } = data;

  console.log("[handleMoveElement] Moving element:", data);

  if (!elementId || !position) {
    throw new Error("ElementId and position are required for move element operation");
  }

  try {
    const result = await moveElement({
      elementId,
      position,
      relative,
      animate
    });

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        newPosition: result.newPosition,
        message: result.message
      }
    });

    console.log("[handleMoveElement] Element moved successfully:", result);
  } catch (error) {
    console.error("[handleMoveElement] Error moving element:", error);
    throw error;
  }
}

/**
 * Handle resize element request
 */
export async function handleResizeElement(id: string, data: any): Promise<void> {
  const { elementId, size, relative, constrainProportions, anchorPoint } = data;

  console.log("[handleResizeElement] Resizing element:", data);

  if (!elementId || !size) {
    throw new Error("ElementId and size are required for resize element operation");
  }

  try {
    const result = await resizeElement({
      elementId,
      size,
      relative,
      constrainProportions,
      anchorPoint
    });

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        newSize: result.newSize,
        message: result.message
      }
    });

    console.log("[handleResizeElement] Element resized successfully:", result);
  } catch (error) {
    console.error("[handleResizeElement] Error resizing element:", error);
    throw error;
  }
}

/**
 * Handle rotate element request
 */
export async function handleRotateElement(id: string, data: any): Promise<void> {
  const { elementId, rotation, relative, anchorPoint } = data;

  console.log("[handleRotateElement] Rotating element:", data);

  if (!elementId || rotation === undefined || rotation === null) {
    throw new Error("ElementId and rotation are required for rotate element operation");
  }

  try {
    const result = await rotateElement({
      elementId,
      rotation,
      relative,
      anchorPoint
    });

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        newRotation: result.newRotation,
        message: result.message
      }
    });

    console.log("[handleRotateElement] Element rotated successfully:", result);
  } catch (error) {
    console.error("[handleRotateElement] Error rotating element:", error);
    throw error;
  }
}

/**
 * Handle tidy up canvas request
 */
export async function handleTidyUp(id: string, data: any): Promise<void> {
  const { elementIds, strategy, spacing, alignment, groupSimilar, removeOverlaps, optimizeConnections } = data;

  console.log("[handleTidyUp] Organizing canvas:", data);

  try {
    const result = await tidyUp({
      elementIds,
      strategy,
      spacing,
      alignment,
      groupSimilar,
      removeOverlaps,
      optimizeConnections
    });

    // Select organized elements if any
    if (result.organized.length > 0) {
      const organizedNodes = result.organized
        .map(id => figma.getNodeById(id))
        .filter(Boolean) as SceneNode[];
      
      if (organizedNodes.length > 0) {
        figma.currentPage.selection = organizedNodes;
        figma.viewport.scrollAndZoomIntoView(organizedNodes as BaseNode[]);
      }
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        organized: result.organized,
        grouped: result.grouped,
        removed: result.removed,
        totalMoved: result.totalMoved,
        totalGroupsCreated: result.totalGroupsCreated,
        bounds: result.bounds,
        message: result.message,
        summary: {
          elementsOrganized: result.organized.length,
          groupsCreated: result.totalGroupsCreated,
          overlapsRemoved: result.removed.length,
          strategy: strategy || 'AUTO'
        }
      }
    });

    console.log("[handleTidyUp] Canvas organized successfully:", result);
  } catch (error) {
    console.error("[handleTidyUp] Error organizing canvas:", error);
    throw error;
  }
}