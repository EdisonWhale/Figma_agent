/**
 * Connector Management Handlers
 * Handles Category 3 operations: update, delete, query, optimize connectors
 */

import { 
  updateConnector, 
  deleteConnector, 
  queryConnectors, 
  optimizeConnectorPaths 
} from '../utils/connector-management';

/**
 * Handle update connector request
 */
export async function handleUpdateConnector(id: string, data: any): Promise<void> {
  const { 
    connectorId, 
    startElementId, 
    endElementId, 
    startPosition, 
    endPosition, 
    strokeWeight, 
    strokeColor, 
    strokeStyle, 
    cornerRadius, 
    magnet 
  } = data;

  console.log("[handleUpdateConnector] Updating connector:", connectorId, data);

  if (!connectorId) {
    throw new Error("ConnectorId is required for update connector operation");
  }

  try {
    const result = await updateConnector({
      connectorId,
      startElementId,
      endElementId,
      startPosition,
      endPosition,
      strokeWeight,
      strokeColor,
      strokeStyle,
      cornerRadius,
      magnet
    });

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        connectorId: result.connectorId,
        message: result.message
      }
    });

    console.log("[handleUpdateConnector] Connector updated successfully:", result);
  } catch (error) {
    console.error("[handleUpdateConnector] Error updating connector:", error);
    throw error;
  }
}

/**
 * Handle delete connector request
 */
export async function handleDeleteConnector(id: string, data: any): Promise<void> {
  const { connectorId } = data;

  console.log("[handleDeleteConnector] Deleting connector:", connectorId);

  if (!connectorId) {
    throw new Error("ConnectorId is required for delete connector operation");
  }

  try {
    const result = await deleteConnector(connectorId);

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        connectorId: result.connectorId,
        message: result.message
      }
    });

    console.log("[handleDeleteConnector] Connector deleted successfully:", result);
  } catch (error) {
    console.error("[handleDeleteConnector] Error deleting connector:", error);
    throw error;
  }
}

/**
 * Handle query connectors request
 */
export async function handleQueryConnectors(id: string, data: any): Promise<void> {
  const { elementIds, region, strokeWeightRange, strokeColor, includeDetails } = data;

  console.log("[handleQueryConnectors] Querying connectors:", data);

  try {
    const result = await queryConnectors({
      elementIds,
      region,
      strokeWeightRange,
      strokeColor,
      includeDetails
    });

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        connectors: result.connectors,
        message: result.message,
        summary: {
          totalFound: result.connectors.length,
          hasDetails: includeDetails !== false,
          filters: {
            byElements: elementIds?.length || 0,
            byRegion: region ? 1 : 0,
            byStrokeWeight: strokeWeightRange ? 1 : 0,
            byStrokeColor: strokeColor ? 1 : 0
          }
        }
      }
    });

    console.log("[handleQueryConnectors] Query completed successfully:", result);
  } catch (error) {
    console.error("[handleQueryConnectors] Error querying connectors:", error);
    throw error;
  }
}

/**
 * Handle optimize connector paths request
 */
export async function handleOptimizeConnectorPaths(id: string, data: any): Promise<void> {
  const { connectorIds, strategy, margin, cornerRadius } = data;

  console.log("[handleOptimizeConnectorPaths] Optimizing connector paths:", data);

  try {
    const result = await optimizeConnectorPaths({
      connectorIds,
      strategy,
      margin,
      cornerRadius
    });

    // Select optimized connectors if any
    if (result.optimized.length > 0) {
      const optimizedNodes = result.optimized
        .map(id => figma.getNodeById(id))
        .filter(Boolean) as SceneNode[];
      
      if (optimizedNodes.length > 0) {
        figma.currentPage.selection = optimizedNodes;
        figma.viewport.scrollAndZoomIntoView(optimizedNodes as BaseNode[]);
      }
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        optimized: result.optimized,
        totalConnectors: result.totalConnectors,
        pathsImproved: result.pathsImproved,
        overlapReductions: result.overlapReductions,
        averagePathReduction: result.averagePathReduction,
        message: result.message,
        summary: {
          successRate: Math.round((result.pathsImproved / result.totalConnectors) * 100),
          strategy: strategy || 'AVOID_OVERLAPS',
          optimizationsApplied: result.optimized.length,
          performance: {
            pathReductions: result.pathsImproved,
            overlapImprovements: result.overlapReductions,
            averageReduction: Math.round(result.averagePathReduction)
          }
        }
      }
    });

    console.log("[handleOptimizeConnectorPaths] Optimization completed successfully:", result);
  } catch (error) {
    console.error("[handleOptimizeConnectorPaths] Error optimizing connector paths:", error);
    throw error;
  }
}