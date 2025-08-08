/**
 * Advanced Visualization Handlers
 * Handles Category 5 operations: create charts, diagrams, and custom visualizations
 */

import { 
  createChart, 
  createDiagram, 
  createVisualization 
} from '../utils/advanced-visualization';

/**
 * Handle create chart request
 */
export async function handleCreateChart(id: string, data: any): Promise<void> {
  const { 
    type, 
    data: chartData, 
    position, 
    size, 
    title, 
    showLegend, 
    showGrid, 
    showAxes, 
    colorScheme, 
    backgroundColor, 
    textColor, 
    fontSize, 
    fontFamily 
  } = data;

  console.log("[handleCreateChart] Creating chart:", type, `with ${chartData?.length || 0} data points`);

  if (!type || !chartData) {
    throw new Error("Chart type and data are required for chart creation");
  }

  if (!Array.isArray(chartData) || chartData.length === 0) {
    throw new Error("Chart data must be a non-empty array");
  }

  // Validate data points
  for (let i = 0; i < chartData.length; i++) {
    const point = chartData[i];
    if (!point.label || typeof point.value !== 'number') {
      throw new Error(`Chart data point ${i + 1} must have 'label' (string) and 'value' (number) properties`);
    }
  }

  try {
    const result = await createChart({
      type,
      data: chartData,
      position,
      size,
      title,
      showLegend,
      showGrid,
      showAxes,
      colorScheme,
      backgroundColor,
      textColor,
      fontSize,
      fontFamily
    });

    // Select the created chart
    const chartElement = figma.getNodeById(result.elementId);
    if (chartElement) {
      figma.currentPage.selection = [chartElement as SceneNode];
      figma.viewport.scrollAndZoomIntoView([chartElement as BaseNode]);
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        type: result.type,
        chartType: result.chartType,
        message: `Created ${type} chart with ${chartData.length} data points`,
        summary: {
          chartType: type,
          dataPoints: chartData.length,
          title: title || 'Untitled Chart',
          size: size || { width: 400, height: 300 },
          features: {
            hasLegend: showLegend !== false,
            hasGrid: showGrid !== false,
            hasAxes: showAxes !== false,
            colorScheme: colorScheme || 'MULTI'
          }
        }
      }
    });

    console.log("[handleCreateChart] Chart created successfully:", result);
  } catch (error) {
    console.error("[handleCreateChart] Error creating chart:", error);
    throw error;
  }
}

/**
 * Handle create diagram request
 */
export async function handleCreateDiagram(id: string, data: any): Promise<void> {
  const { 
    type, 
    nodes, 
    connections, 
    position, 
    size, 
    title, 
    layout, 
    spacing, 
    nodeStyle, 
    connectionStyle 
  } = data;

  console.log("[handleCreateDiagram] Creating diagram:", type, `with ${nodes?.length || 0} nodes`);

  if (!type || !nodes) {
    throw new Error("Diagram type and nodes are required for diagram creation");
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("Diagram nodes must be a non-empty array");
  }

  // Validate nodes
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.id || !node.label) {
      throw new Error(`Diagram node ${i + 1} must have 'id' and 'label' properties`);
    }
  }

  // Validate connections if provided
  if (connections && Array.isArray(connections)) {
    const nodeIds = new Set(nodes.map(n => n.id));
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      if (!conn.from || !conn.to) {
        throw new Error(`Diagram connection ${i + 1} must have 'from' and 'to' properties`);
      }
      if (!nodeIds.has(conn.from) || !nodeIds.has(conn.to)) {
        throw new Error(`Diagram connection ${i + 1} references non-existent node(s)`);
      }
    }
  }

  try {
    const result = await createDiagram({
      type,
      nodes,
      connections,
      position,
      size,
      title,
      layout,
      spacing,
      nodeStyle,
      connectionStyle
    });

    // Select the created diagram
    const diagramElement = figma.getNodeById(result.elementId);
    if (diagramElement) {
      figma.currentPage.selection = [diagramElement as SceneNode];
      figma.viewport.scrollAndZoomIntoView([diagramElement as BaseNode]);
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        type: result.type,
        diagramType: result.diagramType,
        message: `Created ${type} diagram with ${nodes.length} nodes and ${connections?.length || 0} connections`,
        summary: {
          diagramType: type,
          nodeCount: nodes.length,
          connectionCount: connections?.length || 0,
          title: title || 'Untitled Diagram',
          layout: layout || 'AUTO',
          size: size || { width: 600, height: 400 },
          features: {
            hasConnections: (connections?.length || 0) > 0,
            hasTitle: !!title,
            hasCustomStyle: !!(nodeStyle || connectionStyle)
          }
        }
      }
    });

    console.log("[handleCreateDiagram] Diagram created successfully:", result);
  } catch (error) {
    console.error("[handleCreateDiagram] Error creating diagram:", error);
    throw error;
  }
}

/**
 * Handle create visualization request
 */
export async function handleCreateVisualization(id: string, data: any): Promise<void> {
  const { 
    type, 
    elements, 
    position, 
    size, 
    title, 
    layout, 
    theme, 
    responsive 
  } = data;

  console.log("[handleCreateVisualization] Creating visualization:", type, `with ${elements?.length || 0} elements`);

  if (!type || !elements) {
    throw new Error("Visualization type and elements are required for visualization creation");
  }

  if (!Array.isArray(elements) || elements.length === 0) {
    throw new Error("Visualization elements must be a non-empty array");
  }

  // Validate elements
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element.type || !element.data) {
      throw new Error(`Visualization element ${i + 1} must have 'type' and 'data' properties`);
    }
  }

  try {
    const result = await createVisualization({
      type,
      elements,
      position,
      size,
      title,
      layout,
      theme,
      responsive
    });

    // Select the created visualization
    const visualizationElement = figma.getNodeById(result.elementId);
    if (visualizationElement) {
      figma.currentPage.selection = [visualizationElement as SceneNode];
      figma.viewport.scrollAndZoomIntoView([visualizationElement as BaseNode]);
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: {
        elementId: result.elementId,
        type: result.type,
        visualizationType: result.visualizationType,
        message: `Created ${type} visualization with ${elements.length} elements`,
        summary: {
          visualizationType: type,
          elementCount: elements.length,
          title: title || 'Untitled Visualization',
          layout: layout || 'GRID',
          theme: theme || 'LIGHT',
          size: size || { width: 800, height: 600 },
          features: {
            isResponsive: responsive || false,
            hasTitle: !!title,
            elementTypes: Array.from(new Set(elements.map(e => e.type)))
          }
        }
      }
    });

    console.log("[handleCreateVisualization] Visualization created successfully:", result);
  } catch (error) {
    console.error("[handleCreateVisualization] Error creating visualization:", error);
    throw error;
  }
}