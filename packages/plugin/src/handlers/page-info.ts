/**
 * Page Information Handlers
 * Handles operations related to page and document information
 */

import { createSuccessResponse, createErrorResponse, convertNodeToElement, traverseAndCollect } from './utils';
import { HandlerContext } from './types';

/**
 * Get current page information with all elements
 */
export async function handleGetCurrentPageInfo(id: string): Promise<void> {
  try {
    const elements = traverseAndCollect(
      figma.currentPage.children,
      convertNodeToElement
    );

    const pageInfo = {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
      elements,
      selection: figma.currentPage.selection.map(node => node.id),
      viewport: {
        x: figma.viewport.center.x,
        y: figma.viewport.center.y,
        zoom: figma.viewport.zoom,
      },
      editorType: figma.editorType,
    };

    createSuccessResponse(id, pageInfo, "Page info retrieved");
  } catch (error) {
    createErrorResponse(id, error as Error, "get_current_page_info");
    throw error;
  }
}

/**
 * Query elements by filters
 */
export async function handleQueryElements(id: string, data: any): Promise<void> {
  try {
    // For now, return all elements - client will do filtering
    // In a real implementation, we'd filter here based on data.types, data.names, etc.
    await handleGetCurrentPageInfo(id);
  } catch (error) {
    createErrorResponse(id, error as Error, "query_elements");
    throw error;
  }
}

/**
 * Get detailed information about a specific element
 */
export async function handleGetElementDetails(id: string, data: any): Promise<void> {
  try {
    const { elementId } = data;
    
    const node = figma.getNodeById(elementId) as SceneNode;
    if (!node) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const element = convertNodeToElement(node);
    
    createSuccessResponse(id, element, "Element details retrieved");
  } catch (error) {
    createErrorResponse(id, error as Error, "get_element_details");
    throw error;
  }
}

/**
 * Get page statistics
 */
export async function handleGetPageStatistics(id: string): Promise<void> {
  try {
    const elements = traverseAndCollect(
      figma.currentPage.children,
      (node: SceneNode) => ({
        type: node.type,
        visible: node.visible,
        locked: node.locked,
        width: node.width,
        height: node.height,
      })
    );

    // Calculate statistics
    const elementsByType: Record<string, number> = {};
    let totalArea = 0;
    let visibleCount = 0;
    let lockedCount = 0;

    elements.forEach(el => {
      elementsByType[el.type] = (elementsByType[el.type] || 0) + 1;
      totalArea += el.width * el.height;
      if (el.visible) visibleCount++;
      if (el.locked) lockedCount++;
    });

    const statistics = {
      totalElements: elements.length,
      elementsByType,
      selectedCount: figma.currentPage.selection.length,
      visibleCount,
      lockedCount,
      totalArea: Math.round(totalArea),
    };

    createSuccessResponse(id, statistics, "Page statistics calculated");
  } catch (error) {
    createErrorResponse(id, error as Error, "get_page_statistics");
    throw error;
  }
}

/**
 * Get document information (legacy support)
 */
export async function handleGetDocumentInfo(id: string): Promise<void> {
  try {
    const info = {
      documentName: figma.root.name,
      currentPageName: figma.currentPage.name,
      editorType: figma.editorType,
      selectionCount: figma.currentPage.selection.length,
      timestamp: Date.now(),
    };

    createSuccessResponse(id, info, "Document info retrieved");
  } catch (error) {
    createErrorResponse(id, error as Error, "get_document_info");
    throw error;
  }
}