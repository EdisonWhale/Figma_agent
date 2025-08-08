/**
 * Layout and Alignment Handlers
 * Handles alignment and distribution operations for elements
 */

import { 
  createSuccessResponse, 
  createErrorResponse,
  selectAndFocus 
} from './utils';
import { 
  calculateAlignmentPositions, 
  calculateDistributionPositions, 
  ElementInfo 
} from '../utils/geometry';
import { batchUpdateElements } from '../utils/batch';
import { AlignmentData } from './types';

/**
 * Align multiple elements by specified alignment type
 */
export async function handleAlignElements(id: string, data: AlignmentData): Promise<void> {
  try {
    const { nodeIds, alignment, distributeSpacing } = data;
    console.log("[layout-alignment] Aligning elements:", nodeIds, alignment);

    // Get all nodes and convert to ElementInfo format
    const nodes: ElementInfo[] = [];
    const notFoundIds: string[] = [];

    for (const nodeId of nodeIds) {
      const node = figma.getNodeById(nodeId) as SceneNode;
      if (!node) {
        notFoundIds.push(nodeId);
        continue;
      }
      
      nodes.push({
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      });
    }

    if (notFoundIds.length > 0) {
      console.warn(`[layout-alignment] Elements not found: ${notFoundIds.join(', ')}`);
    }

    if (nodes.length === 0) {
      throw new Error("No valid elements found to align");
    }

    // Calculate alignment positions
    const alignmentPositions = calculateAlignmentPositions(nodes, alignment);

    // Apply distribution if spacing is specified
    let distributionPositions = {};
    if (distributeSpacing !== undefined) {
      const direction = ['LEFT', 'CENTER', 'RIGHT'].includes(alignment) ? 'HORIZONTAL' : 'VERTICAL';
      distributionPositions = calculateDistributionPositions(nodes, direction, distributeSpacing);
    }

    // Update element positions
    const result = await batchUpdateElements(
      nodeIds,
      (node, index) => {
        const alignPos = alignmentPositions[node.id];
        const distPos = (distributionPositions as any)[node.id];
        
        if (alignPos?.x !== undefined) node.x = alignPos.x;
        if (alignPos?.y !== undefined) node.y = alignPos.y;
        if (distPos?.x !== undefined) node.x = distPos.x;
        if (distPos?.y !== undefined) node.y = distPos.y;
      }
    );

    // Select aligned elements
    const alignedNodeIds = result.successful.map(s => s.result);
    selectAndFocus(alignedNodeIds);

    // Send response
    const responseResult = {
      ...result,
      alignment: alignment,
      distributeSpacing: distributeSpacing,
      message: `Aligned ${result.successful.length} elements using ${alignment} alignment, ${result.failed.length} failed`
    };

    createSuccessResponse(id, responseResult, "Elements aligned successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "align_elements");
    throw error;
  }
}