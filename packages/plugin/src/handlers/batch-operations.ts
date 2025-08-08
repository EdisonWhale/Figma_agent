/**
 * Batch Operations Handlers
 * Handles batch operations like creating multiple sticky notes
 */

import { 
  loadFontWithFallback,
  getColorFill,
  createSuccessResponse, 
  createErrorResponse,
  selectAndFocus 
} from './utils';
import { calculateLayout } from '../utils/layout';
import { executeBatchOperation } from '../utils/batch';

interface StickyBatchData {
  items: Array<{
    text: string;
    color?: string;
    position?: { x: number; y: number };
  }>;
  layout: "ROW" | "COLUMN" | "GRID";
  spacing?: number;
  startPosition?: { x: number; y: number };
  defaultSize?: { width?: number; height?: number };
}

/**
 * Create multiple sticky notes in batch with automatic layout
 */
export async function handleCreateStickyBatch(id: string, data: StickyBatchData): Promise<void> {
  try {
    // Validate that we're in FigJam
    if (figma.editorType !== "figjam") {
      throw new Error("Sticky notes can only be created in FigJam");
    }

    console.log("[batch-operations] Creating sticky batch with data:", data);

    const { items, layout, spacing, startPosition, defaultSize } = data;

    // Load font before creating any sticky notes
    await loadFontWithFallback();

    // Calculate positions using layout utility
    const effectiveSize = {
      width: defaultSize?.width || 200,
      height: defaultSize?.height || 200
    };
    
    const positions = calculateLayout(
      layout,
      items.length,
      startPosition || { x: 100, y: 100 },
      effectiveSize,
      { spacing }
    );

    // Execute batch creation
    const result = await executeBatchOperation(
      items,
      async (item: any, index) => {
        const sticky = figma.createSticky();

        // Set position (use custom position if provided, otherwise use calculated layout position)
        const position = (item as any).position || positions[index];
        sticky.x = position.x;
        sticky.y = position.y;

        // Set text content
        sticky.text.characters = (item as any).text || "";

        // Set color if provided
        if ((item as any).color) {
          const colorFill = getColorFill((item as any).color);
          if (colorFill) {
            sticky.fills = [colorFill];
          }
        }

        // Set size if using wide width
        if (defaultSize?.width && defaultSize.width > 300) {
          sticky.isWideWidth = true;
        }

        return {
          elementId: sticky.id,
          type: "STICKY",
          text: (item as any).text,
          position: { x: sticky.x, y: sticky.y }
        };
      },
      (item, index) => `sticky_${index}`
    );

    // Select all successfully created sticky notes
    const createdStickies = result.successful.map(s => s.result.elementId);
    selectAndFocus(createdStickies);

    // Send response
    const responseResult = {
      ...result,
      layout: layout,
      totalCreated: result.successful.length,
      createdElements: result.successful.map(s => s.result),
      message: `Created ${result.successful.length} sticky notes in ${layout} layout, ${result.failed.length} failed`
    };

    createSuccessResponse(id, responseResult, "Sticky batch created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_sticky_batch");
    throw error;
  }
}