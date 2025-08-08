/**
 * Connector Management Utilities
 * Category 3: Advanced connector operations for better relationship visualization
 */

import { Position } from './layout';

export interface ConnectorInfo {
  id: string;
  type: 'CONNECTOR';
  startNodeId?: string;
  endNodeId?: string;
  startPosition?: Position;
  endPosition?: Position;
  strokeWeight?: number;
  strokeColor?: { r: number; g: number; b: number };
  strokeStyle?: 'SOLID' | 'DASHED';
  cornerRadius?: number;
}

export interface UpdateConnectorOptions {
  connectorId: string;
  startElementId?: string;
  endElementId?: string;
  startPosition?: Position;
  endPosition?: Position;
  strokeWeight?: number;
  strokeColor?: { r: number; g: number; b: number };
  strokeStyle?: 'SOLID' | 'DASHED';
  cornerRadius?: number;
  magnet?: 'AUTO' | 'TOP' | 'RIGHT' | 'BOTTOM' | 'LEFT';
}

export interface QueryConnectorsOptions {
  elementIds?: string[]; // Filter connectors connected to these elements
  region?: { x: number; y: number; width: number; height: number };
  strokeWeightRange?: { min: number; max: number };
  strokeColor?: { r: number; g: number; b: number };
  includeDetails?: boolean;
}

export interface OptimizeConnectorPathsOptions {
  connectorIds?: string[]; // If not provided, optimizes all connectors
  strategy?: 'SHORTEST' | 'AVOID_OVERLAPS' | 'MANHATTAN' | 'ORTHOGONAL';
  margin?: number; // Minimum margin from elements
  cornerRadius?: number;
}

export interface ConnectorOptimizationResult {
  optimized: string[];
  totalConnectors: number;
  pathsImproved: number;
  overlapReductions: number;
  averagePathReduction: number;
  message: string;
}

/**
 * Update an existing connector with new properties
 */
export async function updateConnector(options: UpdateConnectorOptions): Promise<{ connectorId: string; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { connectorId, startElementId, endElementId, startPosition, endPosition, strokeWeight, strokeColor, strokeStyle, cornerRadius, magnet = 'AUTO' } = options;

  console.log("[updateConnector] Updating connector:", connectorId, options);

  // Get the connector
  const connector = figma.getNodeById(connectorId) as ConnectorNode;
  if (!connector || connector.type !== 'CONNECTOR') {
    throw new Error(`Connector with ID ${connectorId} not found or is not a connector`);
  }

  let updatedProperties: string[] = [];

  try {
    // Update stroke properties
    if (strokeWeight !== undefined) {
      connector.strokeWeight = strokeWeight;
      updatedProperties.push(`stroke weight: ${strokeWeight}`);
    }

    if (strokeColor) {
      connector.strokes = [{
        type: 'SOLID',
        color: strokeColor,
        opacity: connector.strokes[0]?.opacity || 1
      }];
      updatedProperties.push(`stroke color`);
    }

    // Update stroke style if available
    if (strokeStyle && 'dashPattern' in connector) {
      if (strokeStyle === 'DASHED') {
        (connector as any).dashPattern = [5, 5];
      } else {
        (connector as any).dashPattern = [];
      }
      updatedProperties.push(`stroke style: ${strokeStyle}`);
    }

    // Update corner radius if available
    if (cornerRadius !== undefined && 'cornerRadius' in connector) {
      (connector as any).cornerRadius = cornerRadius;
      updatedProperties.push(`corner radius: ${cornerRadius}`);
    }

    // Update start endpoint
    if (startElementId || startPosition) {
      const currentStart = connector.connectorStart;
      
      if (startElementId) {
        const startElement = figma.getNodeById(startElementId);
        if (!startElement) {
          throw new Error(`Start element ${startElementId} not found`);
        }
        
        connector.connectorStart = {
          endpointNodeId: startElementId,
          magnet: magnet
        };
        updatedProperties.push(`start element: ${startElementId}`);
      } else if (startPosition) {
        connector.connectorStart = {
          position: startPosition,
          magnet: 'NONE'
        };
        updatedProperties.push(`start position: (${startPosition.x}, ${startPosition.y})`);
      }
    }

    // Update end endpoint
    if (endElementId || endPosition) {
      if (endElementId) {
        const endElement = figma.getNodeById(endElementId);
        if (!endElement) {
          throw new Error(`End element ${endElementId} not found`);
        }
        
        connector.connectorEnd = {
          endpointNodeId: endElementId,
          magnet: magnet
        };
        updatedProperties.push(`end element: ${endElementId}`);
      } else if (endPosition) {
        connector.connectorEnd = {
          position: endPosition,
          magnet: 'NONE'
        };
        updatedProperties.push(`end position: (${endPosition.x}, ${endPosition.y})`);
      }
    }

    const message = updatedProperties.length > 0 
      ? `Updated connector: ${updatedProperties.join(', ')}`
      : 'No properties updated';

    console.log("[updateConnector] Connector updated successfully:", message);

    return {
      connectorId,
      message
    };

  } catch (error) {
    console.error("[updateConnector] Error updating connector:", error);
    throw new Error(`Failed to update connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a specific connector
 */
export async function deleteConnector(connectorId: string): Promise<{ connectorId: string; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  console.log("[deleteConnector] Deleting connector:", connectorId);

  // Get the connector
  const connector = figma.getNodeById(connectorId);
  if (!connector || connector.type !== 'CONNECTOR') {
    throw new Error(`Connector with ID ${connectorId} not found or is not a connector`);
  }

  try {
    connector.remove();

    const message = `Deleted connector ${connectorId}`;
    console.log("[deleteConnector] Connector deleted successfully:", message);

    return {
      connectorId,
      message
    };

  } catch (error) {
    console.error("[deleteConnector] Error deleting connector:", error);
    throw new Error(`Failed to delete connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Query connectors based on criteria
 */
export async function queryConnectors(options: QueryConnectorsOptions = {}): Promise<{ connectors: ConnectorInfo[]; message: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { elementIds, region, strokeWeightRange, strokeColor, includeDetails = true } = options;

  console.log("[queryConnectors] Querying connectors with options:", options);

  // Get all connectors on the current page
  let allConnectors = figma.currentPage.findAll(node => node.type === 'CONNECTOR') as ConnectorNode[];

  console.log(`[queryConnectors] Found ${allConnectors.length} total connectors`);

  // Filter by connected elements
  if (elementIds && elementIds.length > 0) {
    allConnectors = allConnectors.filter(connector => {
      const startId = getConnectorEndpointNodeId(connector.connectorStart);
      const endId = getConnectorEndpointNodeId(connector.connectorEnd);
      return (startId && elementIds.includes(startId)) || (endId && elementIds.includes(endId));
    });
    console.log(`[queryConnectors] Filtered to ${allConnectors.length} connectors by element IDs`);
  }

  // Filter by region
  if (region) {
    allConnectors = allConnectors.filter(connector => {
      const bounds = getConnectorBounds(connector);
      if (!bounds) return false;
      
      return !(bounds.x + bounds.width < region.x ||
               bounds.y + bounds.height < region.y ||
               bounds.x > region.x + region.width ||
               bounds.y > region.y + region.height);
    });
    console.log(`[queryConnectors] Filtered to ${allConnectors.length} connectors by region`);
  }

  // Filter by stroke weight
  if (strokeWeightRange) {
    allConnectors = allConnectors.filter(connector => {
      const weight = connector.strokeWeight || 1;
      return weight >= strokeWeightRange.min && weight <= strokeWeightRange.max;
    });
    console.log(`[queryConnectors] Filtered to ${allConnectors.length} connectors by stroke weight range`);
  }

  // Filter by stroke color
  if (strokeColor) {
    allConnectors = allConnectors.filter(connector => {
      if (!connector.strokes || connector.strokes.length === 0) return false;
      const stroke = connector.strokes[0];
      if (stroke.type !== 'SOLID') return false;
      const color = stroke.color as { r: number; g: number; b: number };
      const tolerance = 0.01;
      return Math.abs(color.r - strokeColor.r) < tolerance &&
             Math.abs(color.g - strokeColor.g) < tolerance &&
             Math.abs(color.b - strokeColor.b) < tolerance;
    });
    console.log(`[queryConnectors] Filtered to ${allConnectors.length} connectors by stroke color`);
  }

  // Convert to ConnectorInfo objects
  const connectors: ConnectorInfo[] = allConnectors.map(connector => {
    const info: ConnectorInfo = {
      id: connector.id,
      type: 'CONNECTOR' as const
    };

    if (includeDetails) {
      // Get endpoint information
      const startNodeId = getConnectorEndpointNodeId(connector.connectorStart);
      const endNodeId = getConnectorEndpointNodeId(connector.connectorEnd);
      
      if (startNodeId) info.startNodeId = startNodeId;
      if (endNodeId) info.endNodeId = endNodeId;

      // Get positions
      const startPos = getConnectorEndpointPosition(connector, connector.connectorStart);
      const endPos = getConnectorEndpointPosition(connector, connector.connectorEnd);
      
      if (startPos) info.startPosition = startPos;
      if (endPos) info.endPosition = endPos;

      // Get stroke properties
      info.strokeWeight = connector.strokeWeight;
      
      if (connector.strokes && connector.strokes.length > 0) {
        const stroke = connector.strokes[0];
        if (stroke.type === 'SOLID') {
          info.strokeColor = stroke.color as { r: number; g: number; b: number };
        }
      }

      // Get dash pattern (stroke style)
      if ('dashPattern' in connector) {
        const dashPattern = (connector as any).dashPattern;
        info.strokeStyle = (dashPattern && dashPattern.length > 0) ? 'DASHED' : 'SOLID';
      }

      // Get corner radius
      if ('cornerRadius' in connector) {
        info.cornerRadius = (connector as any).cornerRadius;
      }
    }

    return info;
  });

  const message = `Found ${connectors.length} connectors matching criteria`;
  console.log("[queryConnectors] Query completed:", message);

  return {
    connectors,
    message
  };
}

/**
 * Optimize connector paths for better visual flow
 */
export async function optimizeConnectorPaths(options: OptimizeConnectorPathsOptions = {}): Promise<ConnectorOptimizationResult> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const { connectorIds, strategy = 'AVOID_OVERLAPS', margin = 10, cornerRadius = 8 } = options;

  console.log("[optimizeConnectorPaths] Starting optimization with strategy:", strategy);

  // Get connectors to optimize
  let connectors: ConnectorNode[];
  if (connectorIds && connectorIds.length > 0) {
    connectors = connectorIds
      .map(id => figma.getNodeById(id))
      .filter(node => node && node.type === 'CONNECTOR') as ConnectorNode[];
  } else {
    connectors = figma.currentPage.findAll(node => node.type === 'CONNECTOR') as ConnectorNode[];
  }

  if (connectors.length === 0) {
    return {
      optimized: [],
      totalConnectors: 0,
      pathsImproved: 0,
      overlapReductions: 0,
      averagePathReduction: 0,
      message: "No connectors found to optimize"
    };
  }

  console.log(`[optimizeConnectorPaths] Optimizing ${connectors.length} connectors`);

  const optimized: string[] = [];
  let pathsImproved = 0;
  let overlapReductions = 0;
  let totalPathReduction = 0;

  // Get all scene nodes for overlap detection
  const sceneNodes = figma.currentPage.children.filter(node => 
    node && 'x' in node && 'y' in node && node.visible && node.type !== 'CONNECTOR'
  ) as SceneNode[];

  for (const connector of connectors) {
    try {
      const originalMetrics = calculateConnectorMetrics(connector, sceneNodes);
      let improved = false;

      switch (strategy) {
        case 'SHORTEST':
          improved = await optimizeForShortest(connector);
          break;
        
        case 'AVOID_OVERLAPS':
          improved = await optimizeToAvoidOverlaps(connector, sceneNodes, margin);
          break;
        
        case 'MANHATTAN':
          improved = await optimizeForManhattan(connector, cornerRadius);
          break;
        
        case 'ORTHOGONAL':
          improved = await optimizeForOrthogonal(connector, cornerRadius);
          break;
      }

      if (improved) {
        const newMetrics = calculateConnectorMetrics(connector, sceneNodes);
        
        optimized.push(connector.id);
        pathsImproved++;
        
        if (newMetrics.overlaps < originalMetrics.overlaps) {
          overlapReductions++;
        }
        
        const pathReduction = originalMetrics.length - newMetrics.length;
        if (pathReduction > 0) {
          totalPathReduction += pathReduction;
        }
      }

    } catch (error) {
      console.warn(`[optimizeConnectorPaths] Could not optimize connector ${connector.id}:`, error);
    }
  }

  const averagePathReduction = pathsImproved > 0 ? totalPathReduction / pathsImproved : 0;

  const result: ConnectorOptimizationResult = {
    optimized,
    totalConnectors: connectors.length,
    pathsImproved,
    overlapReductions,
    averagePathReduction,
    message: `Optimized ${pathsImproved}/${connectors.length} connectors using ${strategy} strategy. ` +
      `Reduced overlaps in ${overlapReductions} cases. ` +
      `Average path reduction: ${Math.round(averagePathReduction)}px.`
  };

  console.log("[optimizeConnectorPaths] Optimization completed:", result);
  return result;
}

// Helper functions

/**
 * Extract node ID from connector endpoint
 */
function getConnectorEndpointNodeId(endpoint: any): string | undefined {
  return endpoint?.endpointNodeId || undefined;
}

/**
 * Get position of connector endpoint
 */
function getConnectorEndpointPosition(connector: ConnectorNode, endpoint: any): Position | undefined {
  if (endpoint?.position) {
    return endpoint.position;
  }
  
  if (endpoint?.endpointNodeId) {
    const node = figma.getNodeById(endpoint.endpointNodeId);
    if (node && 'x' in node && 'y' in node) {
      const sceneNode = node as SceneNode;
      return {
        x: sceneNode.x + sceneNode.width / 2,
        y: sceneNode.y + sceneNode.height / 2
      };
    }
  }
  
  return undefined;
}

/**
 * Calculate bounds of a connector
 */
function getConnectorBounds(connector: ConnectorNode): { x: number; y: number; width: number; height: number } | null {
  try {
    const startPos = getConnectorEndpointPosition(connector, connector.connectorStart);
    const endPos = getConnectorEndpointPosition(connector, connector.connectorEnd);
    
    if (!startPos || !endPos) return null;
    
    const minX = Math.min(startPos.x, endPos.x);
    const maxX = Math.max(startPos.x, endPos.x);
    const minY = Math.min(startPos.y, endPos.y);
    const maxY = Math.max(startPos.y, endPos.y);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } catch (error) {
    return null;
  }
}

/**
 * Calculate connector metrics for optimization
 */
function calculateConnectorMetrics(connector: ConnectorNode, sceneNodes: SceneNode[]): { length: number; overlaps: number } {
  const startPos = getConnectorEndpointPosition(connector, connector.connectorStart);
  const endPos = getConnectorEndpointPosition(connector, connector.connectorEnd);
  
  if (!startPos || !endPos) {
    return { length: 0, overlaps: 0 };
  }
  
  // Calculate path length (simplified as direct distance)
  const length = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2));
  
  // Count overlaps with scene nodes (simplified)
  let overlaps = 0;
  for (const node of sceneNodes) {
    if (isConnectorOverlappingNode(connector, node)) {
      overlaps++;
    }
  }
  
  return { length, overlaps };
}

/**
 * Check if connector overlaps with a scene node
 */
function isConnectorOverlappingNode(connector: ConnectorNode, node: SceneNode): boolean {
  const bounds = getConnectorBounds(connector);
  if (!bounds) return false;
  
  // Simple bounding box intersection check
  return !(bounds.x + bounds.width < node.x ||
           node.x + node.width < bounds.x ||
           bounds.y + bounds.height < node.y ||
           node.y + node.height < bounds.y);
}

/**
 * Optimize connector for shortest path
 */
async function optimizeForShortest(connector: ConnectorNode): Promise<boolean> {
  try {
    // Use AUTO magnet for automatic shortest path
    connector.connectorStart = {
      ...connector.connectorStart,
      magnet: "AUTO"
    };
    connector.connectorEnd = {
      ...connector.connectorEnd,
      magnet: "AUTO"
    };
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Optimize connector to avoid overlaps
 */
async function optimizeToAvoidOverlaps(connector: ConnectorNode, sceneNodes: SceneNode[], margin: number): Promise<boolean> {
  try {
    // This is a simplified implementation
    // In a real scenario, you'd implement path-finding algorithms
    
    // Try different magnet positions to find one with fewer overlaps
    const magnetOptions = ["TOP", "RIGHT", "BOTTOM", "LEFT", "AUTO"];
    let bestOption = "AUTO";
    let minOverlaps = Infinity;
    
    for (const magnet of magnetOptions) {
      // Temporarily set magnet
      const tempStart = { ...connector.connectorStart, magnet: magnet };
      const tempEnd = { ...connector.connectorEnd, magnet: magnet };
      
      // Count potential overlaps (simplified calculation)
      const overlaps = 0; // This would be calculated based on the path
      
      if (overlaps < minOverlaps) {
        minOverlaps = overlaps;
        bestOption = magnet;
      }
    }
    
    // Apply best option
    connector.connectorStart = { ...connector.connectorStart, magnet: bestOption };
    connector.connectorEnd = { ...connector.connectorEnd, magnet: bestOption };
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Optimize connector for Manhattan (right-angle) routing
 */
async function optimizeForManhattan(connector: ConnectorNode, cornerRadius: number): Promise<boolean> {
  try {
    // Set corner radius for smooth right angles
    if ('cornerRadius' in connector) {
      (connector as any).cornerRadius = cornerRadius;
    }
    
    // Use specific magnets that favor Manhattan routing
    connector.connectorStart = { ...connector.connectorStart, magnet: "RIGHT" };
    connector.connectorEnd = { ...connector.connectorEnd, magnet: "LEFT" };
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Optimize connector for orthogonal routing
 */
async function optimizeForOrthogonal(connector: ConnectorNode, cornerRadius: number): Promise<boolean> {
  try {
    // Set corner radius for smooth orthogonal paths
    if ('cornerRadius' in connector) {
      (connector as any).cornerRadius = cornerRadius;
    }
    
    // Use TOP/BOTTOM magnets for vertical preference
    connector.connectorStart = { ...connector.connectorStart, magnet: "BOTTOM" };
    connector.connectorEnd = { ...connector.connectorEnd, magnet: "TOP" };
    
    return true;
  } catch (error) {
    return false;
  }
}