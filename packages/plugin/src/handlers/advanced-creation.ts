/**
 * Advanced Creation Handlers
 * Handles creation of complex elements like flowcharts, mind maps, and specialized shapes
 */

import { 
  createSuccessResponse, 
  createErrorResponse,
  selectAndFocus 
} from './utils';
import { FlowchartData, MindMapData } from './types';

// Import utilities from existing utils
import { 
  calculateFlowchartLayout, 
  createFlowchartShape, 
  createFlowchartConnector, 
  calculateFlowchartBounds,
  FlowchartNode,
  FlowchartConnection
} from '../utils/flowchart';
import { 
  calculateMindMapLayout, 
  createMindMapNode, 
  createMindMapConnector, 
  calculateMindMapBounds,
  MindMapBranch
} from '../utils/mindmap';
import { 
  createShapeWithText,
  createCodeBlock,
  createPolygon,
  createStar,
  createFrame,
  createSection
} from '../utils/shapes';
import { executeBatchOperation } from '../utils/batch';

/**
 * Create a flowchart diagram with automatic layout and connections
 */
export async function handleCreateFlowchart(id: string, data: FlowchartData): Promise<void> {
  try {
    const { nodes, connections, layout, spacing, startPosition } = data;
    console.log("[advanced-creation] Creating flowchart with data:", data);

    // Validate nodes
    if (!nodes || nodes.length === 0) {
      throw new Error("No nodes provided for flowchart");
    }

    // Calculate optimal positions for all nodes
    const nodePositions = calculateFlowchartLayout(nodes, connections, {
      layout,
      spacing,
      startPosition
    });

    // Create all flowchart shapes
    const createdNodes: { [nodeId: string]: string } = {}; // Map node ID to element ID
    const nodeResults = await executeBatchOperation(
      nodes,
      async (node: FlowchartNode) => {
        const position = nodePositions[node.id];
        if (!position) {
          throw new Error(`No position calculated for node ${node.id}`);
        }

        const result = await createFlowchartShape(node.type, node.text, position);
        createdNodes[node.id] = result.elementId;
        
        return {
          nodeId: node.id,
          elementId: result.elementId,
          type: result.type,
          text: node.text,
          position
        };
      },
      (node) => node.id
    );

    // Create connections between nodes
    let connectionResults = { successful: [] as any[], failed: [] as any[] };
    if (connections && connections.length > 0) {
      connectionResults = await executeBatchOperation(
        connections,
        async (connection: FlowchartConnection) => {
          const fromElementId = createdNodes[connection.from];
          const toElementId = createdNodes[connection.to];
          
          if (!fromElementId) {
            throw new Error(`Source node ${connection.from} not found`);
          }
          if (!toElementId) {
            throw new Error(`Target node ${connection.to} not found`);
          }

          const result = await createFlowchartConnector(
            fromElementId,
            toElementId,
            connection.label
          );
          
          return {
            from: connection.from,
            to: connection.to,
            label: connection.label,
            elementId: result.elementId
          };
        },
        (connection) => `${connection.from}->${connection.to}`
      );
    }

    // Select all created elements
    const allCreatedElements = [
      ...nodeResults.successful.map(s => s.result.elementId),
      ...connectionResults.successful.map(s => s.result.elementId)
    ];
    selectAndFocus(allCreatedElements);

    // Calculate flowchart bounds for summary
    const bounds = calculateFlowchartBounds(nodePositions);

    // Send response
    const result = {
      nodes: nodeResults,
      connections: connectionResults,
      layout: layout,
      totalNodes: nodeResults.successful.length,
      totalConnections: connectionResults.successful.length,
      failedNodes: nodeResults.failed.length,
      failedConnections: connectionResults.failed.length,
      bounds: bounds,
      message: `Created flowchart with ${nodeResults.successful.length} nodes and ${connectionResults.successful.length} connections in ${layout} layout`
    };

    createSuccessResponse(id, result, "Flowchart created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_flowchart");
    throw error;
  }
}

/**
 * Create a mind map diagram with radial layout and branches
 */
export async function handleCreateMindMap(id: string, data: MindMapData): Promise<void> {
  try {
    const { centralTopic, branches, startPosition, branchSpacing } = data;
    console.log("[advanced-creation] Creating mind map with data:", data);

    // Validate input
    if (!centralTopic) {
      throw new Error("Central topic is required for mind map");
    }
    if (!branches || branches.length === 0) {
      throw new Error("At least one branch is required for mind map");
    }

    // Calculate layout for all nodes
    const layout = calculateMindMapLayout(centralTopic, branches, {
      startPosition,
      branchSpacing
    });

    // Create central node
    const centralResult = await createMindMapNode(
      centralTopic,
      layout.central,
      'central'
    );

    // Create branch nodes and their children
    const createdElements: string[] = [centralResult.elementId];
    const branchElements: { [branchIndex: number]: string } = {};

    // Create all branch nodes
    const branchResults = await executeBatchOperation(
      layout.branches,
      async (branch, index) => {
        const result = await createMindMapNode(
          branch.text,
          branch.position,
          'branch',
          branch.color
        );
        
        branchElements[index] = result.elementId;
        createdElements.push(result.elementId);
        
        return {
          branchIndex: index,
          elementId: result.elementId,
          text: branch.text,
          position: branch.position,
          color: branch.color
        };
      },
      (_, index) => `branch_${index}`
    );

    // Create child nodes for each branch
    const childResults = await executeBatchOperation(
      layout.branches.flatMap((branch, branchIndex) => 
        branch.children.map(child => ({ ...child, branchIndex }))
      ),
      async (child) => {
        const result = await createMindMapNode(
          child.text,
          child.position,
          'child'
        );
        
        createdElements.push(result.elementId);
        
        return {
          branchIndex: child.branchIndex,
          elementId: result.elementId,
          text: child.text,
          position: child.position
        };
      },
      (child, index) => `child_${child.branchIndex}_${index}`
    );

    // Create connectors from central to branches
    const centralConnectors = await executeBatchOperation(
      branchResults.successful,
      async (branch) => {
        const result = await createMindMapConnector(
          centralResult.elementId,
          branch.result.elementId
        );
        
        createdElements.push(result.elementId);
        
        return {
          from: 'central',
          to: `branch_${branch.result.branchIndex}`,
          elementId: result.elementId
        };
      },
      (branch) => `connector_central_${branch.result.branchIndex}`
    );

    // Create connectors from branches to children
    const branchConnectors = await executeBatchOperation(
      childResults.successful,
      async (child) => {
        const branchElementId = branchElements[child.result.branchIndex];
        if (!branchElementId) {
          throw new Error(`Branch element not found for index ${child.result.branchIndex}`);
        }
        
        const result = await createMindMapConnector(
          branchElementId,
          child.result.elementId
        );
        
        createdElements.push(result.elementId);
        
        return {
          from: `branch_${child.result.branchIndex}`,
          to: child.id,
          elementId: result.elementId
        };
      },
      (child) => `connector_${child.result.branchIndex}_${child.id}`
    );

    // Select all created elements
    selectAndFocus(createdElements);

    // Calculate mind map bounds for summary
    const bounds = calculateMindMapBounds(layout);

    // Send response
    const result = {
      central: {
        text: centralTopic,
        elementId: centralResult.elementId
      },
      branches: branchResults,
      children: childResults,
      connectors: {
        central: centralConnectors,
        branches: branchConnectors
      },
      totalElements: createdElements.length,
      totalBranches: branchResults.successful.length,
      totalChildren: childResults.successful.length,
      bounds: bounds,
      message: `Created mind map "${centralTopic}" with ${branchResults.successful.length} branches and ${childResults.successful.length} child nodes`
    };

    createSuccessResponse(id, result, "Mind map created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_mindmap");
    throw error;
  }
}

/**
 * Create a shape with integrated text
 */
export async function handleCreateShapeWithText(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating shape with text:", data);

    const { text, shapeType } = data;
    if (!text || !shapeType) {
      throw new Error("Text and shapeType are required for shape with text creation");
    }

    const result = await createShapeWithText(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created ${shapeType} with text: "${text}"`
    };

    createSuccessResponse(id, responseResult, "Shape with text created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_shape_with_text");
    throw error;
  }
}

/**
 * Create a code block with syntax highlighting styling
 */
export async function handleCreateCodeBlock(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating code block:", data);

    const { code, language } = data;
    if (!code) {
      throw new Error("Code content is required for code block creation");
    }

    const result = await createCodeBlock(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created ${language || 'generic'} code block with ${code.split('\n').length} lines`
    };

    createSuccessResponse(id, responseResult, "Code block created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_code_block");
    throw error;
  }
}

/**
 * Create a polygon shape
 */
export async function handleCreatePolygon(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating polygon:", data);

    const { pointCount } = data;
    if (!pointCount || pointCount < 3 || pointCount > 20) {
      throw new Error("Point count must be between 3 and 20 for polygon creation");
    }

    const result = await createPolygon(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created ${pointCount}-sided polygon`
    };

    createSuccessResponse(id, responseResult, "Polygon created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_polygon");
    throw error;
  }
}

/**
 * Create a star shape
 */
export async function handleCreateStar(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating star:", data);

    const { pointCount, innerRadius } = data;
    if (!pointCount || pointCount < 3 || pointCount > 20) {
      throw new Error("Point count must be between 3 and 20 for star creation");
    }
    if (!innerRadius || innerRadius < 0.1 || innerRadius > 0.9) {
      throw new Error("Inner radius must be between 0.1 and 0.9 for star creation");
    }

    const result = await createStar(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created ${pointCount}-point star with ${Math.round(innerRadius * 100)}% inner radius`
    };

    createSuccessResponse(id, responseResult, "Star created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_star");
    throw error;
  }
}

/**
 * Create a frame container
 */
export async function handleCreateFrame(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating frame:", data);

    const result = await createFrame(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created frame: "${data.name || 'Frame'}"`
    };

    createSuccessResponse(id, responseResult, "Frame created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_frame");
    throw error;
  }
}

/**
 * Create a section area
 */
export async function handleCreateSection(id: string, data: any): Promise<void> {
  try {
    console.log("[advanced-creation] Creating section:", data);

    const result = await createSection(data);
    
    const responseResult = {
      elementId: result.elementId,
      type: result.type,
      message: `Created section: "${data.title || 'Section'}" (${figma.editorType === 'figjam' ? 'native' : 'frame-based'})`
    };

    createSuccessResponse(id, responseResult, "Section created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_section");
    throw error;
  }
}