/**
 * Advanced Visualization Utilities
 * Category 5: Create sophisticated charts, diagrams, and data visualizations
 */

import { Position, Size } from './layout';
import { loadFontWithFallback } from './batch';

export interface ChartData {
  label: string;
  value: number;
  color?: { r: number; g: number; b: number };
}

export interface CreateChartOptions {
  type: 'BAR' | 'LINE' | 'PIE' | 'SCATTER' | 'AREA' | 'DONUT' | 'HISTOGRAM';
  data: ChartData[];
  position?: Position;
  size?: Size;
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  colorScheme?: 'BLUE' | 'GREEN' | 'RED' | 'PURPLE' | 'ORANGE' | 'MULTI';
  backgroundColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
  fontSize?: number;
  fontFamily?: string;
}

export interface CreateDiagramOptions {
  type: 'ORG_CHART' | 'NETWORK' | 'TIMELINE' | 'PROCESS_FLOW' | 'HIERARCHY' | 'MATRIX';
  nodes: DiagramNode[];
  connections?: DiagramConnection[];
  position?: Position;
  size?: Size;
  title?: string;
  layout?: 'TOP_DOWN' | 'LEFT_RIGHT' | 'RADIAL' | 'CIRCULAR' | 'MATRIX' | 'AUTO';
  spacing?: { x: number; y: number };
  nodeStyle?: NodeStyle;
  connectionStyle?: ConnectionStyle;
}

export interface DiagramNode {
  id: string;
  label: string;
  type?: 'LEADER' | 'MANAGER' | 'EMPLOYEE' | 'PROCESS' | 'DECISION' | 'EVENT' | 'MILESTONE';
  level?: number;
  parentId?: string;
  data?: any;
  color?: { r: number; g: number; b: number };
  icon?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type?: 'SOLID' | 'DASHED' | 'DOTTED' | 'ARROW';
  weight?: number;
}

export interface NodeStyle {
  backgroundColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  borderWidth?: number;
  cornerRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
}

export interface ConnectionStyle {
  strokeColor?: { r: number; g: number; b: number };
  strokeWeight?: number;
  strokeStyle?: 'SOLID' | 'DASHED' | 'DOTTED';
  arrowType?: 'NONE' | 'ARROW' | 'CIRCLE' | 'DIAMOND';
}

export interface CreateVisualizationOptions {
  type: 'CUSTOM' | 'DASHBOARD' | 'INFOGRAPHIC' | 'DATA_STORY' | 'COMPARISON' | 'TREND_ANALYSIS';
  elements: VisualizationElement[];
  position?: Position;
  size?: Size;
  title?: string;
  layout?: 'GRID' | 'FLOW' | 'LAYERED' | 'RADIAL';
  theme?: 'LIGHT' | 'DARK' | 'COLORFUL' | 'MINIMAL';
  responsive?: boolean;
}

export interface VisualizationElement {
  type: 'CHART' | 'TEXT' | 'ICON' | 'IMAGE' | 'SHAPE' | 'METRIC';
  data: any;
  position?: Position;
  size?: Size;
  style?: any;
}

/**
 * Create various types of charts with data visualization
 */
export async function createChart(options: CreateChartOptions): Promise<{ elementId: string; type: string; chartType: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    type,
    data,
    position = { x: 0, y: 0 },
    size = { width: 400, height: 300 },
    title,
    showLegend = true,
    showGrid = true,
    showAxes = true,
    colorScheme = 'MULTI',
    backgroundColor = { r: 1, g: 1, b: 1 },
    textColor = { r: 0.2, g: 0.2, b: 0.2 },
    fontSize = 12,
    fontFamily = 'Inter'
  } = options;

  console.log(`[createChart] Creating ${type} chart with ${data.length} data points`);

  // Load font first
  await loadFontWithFallback();

  // Create main container frame
  const chartFrame = figma.createFrame();
  chartFrame.name = `${type} Chart${title ? `: ${title}` : ''}`;
  chartFrame.x = position.x;
  chartFrame.y = position.y;
  chartFrame.resize(size.width, size.height);
  chartFrame.fills = [{ type: 'SOLID', color: backgroundColor }];

  const elements: SceneNode[] = [chartFrame];

  // Calculate chart area (leaving space for title, legend, axes)
  const titleHeight = title ? 40 : 0;
  const legendHeight = showLegend ? 60 : 0;
  const axesMargin = showAxes ? 50 : 20;
  
  const chartArea = {
    x: axesMargin,
    y: titleHeight + 20,
    width: size.width - axesMargin - (showLegend ? 150 : 20),
    height: size.height - titleHeight - legendHeight - 40
  };

  // Add title if provided
  if (title) {
    const titleText = figma.createText();
    titleText.characters = title;
    titleText.fontSize = fontSize + 4;
    titleText.fontName = { family: fontFamily, style: 'Medium' };
    titleText.fills = [{ type: 'SOLID', color: textColor }];
    titleText.x = position.x + size.width / 2 - titleText.width / 2;
    titleText.y = position.y + 10;
    elements.push(titleText);
  }

  // Generate colors for data
  const colors = generateColorScheme(data.length, colorScheme);
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index]
  }));

  // Create chart based on type
  let chartElements: SceneNode[] = [];

  switch (type) {
    case 'BAR':
      chartElements = await createBarChart(dataWithColors, chartArea, showAxes, showGrid, textColor, fontSize, fontFamily);
      break;
    case 'LINE':
      chartElements = await createLineChart(dataWithColors, chartArea, showAxes, showGrid, textColor, fontSize, fontFamily);
      break;
    case 'PIE':
      chartElements = await createPieChart(dataWithColors, chartArea, textColor, fontSize, fontFamily);
      break;
    case 'SCATTER':
      chartElements = await createScatterChart(dataWithColors, chartArea, showAxes, showGrid, textColor, fontSize, fontFamily);
      break;
    case 'AREA':
      chartElements = await createAreaChart(dataWithColors, chartArea, showAxes, showGrid, textColor, fontSize, fontFamily);
      break;
    case 'DONUT':
      chartElements = await createDonutChart(dataWithColors, chartArea, textColor, fontSize, fontFamily);
      break;
    case 'HISTOGRAM':
      chartElements = await createHistogramChart(dataWithColors, chartArea, showAxes, showGrid, textColor, fontSize, fontFamily);
      break;
  }

  elements.push(...chartElements);

  // Create legend if requested
  if (showLegend && dataWithColors.length > 0) {
    const legendElements = await createChartLegend(dataWithColors, {
      x: position.x + chartArea.x + chartArea.width + 20,
      y: position.y + titleHeight + 40,
      width: 120,
      height: Math.min(chartArea.height, dataWithColors.length * 25)
    }, textColor, fontSize - 1, fontFamily);
    elements.push(...legendElements);
  }

  // Group all elements
  const chartGroup = figma.group(elements, figma.currentPage);
  chartGroup.name = `${type} Chart${title ? `: ${title}` : ''}`;

  return {
    elementId: chartGroup.id,
    type: 'chart',
    chartType: type
  };
}

/**
 * Create specialized diagrams
 */
export async function createDiagram(options: CreateDiagramOptions): Promise<{ elementId: string; type: string; diagramType: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    type,
    nodes,
    connections = [],
    position = { x: 0, y: 0 },
    size = { width: 600, height: 400 },
    title,
    layout = 'AUTO',
    spacing = { x: 120, y: 80 },
    nodeStyle = {},
    connectionStyle = {}
  } = options;

  console.log(`[createDiagram] Creating ${type} diagram with ${nodes.length} nodes`);

  // Load font first
  await loadFontWithFallback();

  const elements: SceneNode[] = [];

  // Calculate layout positions for nodes
  const nodePositions = calculateDiagramLayout(nodes, connections, layout, spacing, size);

  // Create nodes
  const nodeElements: { [key: string]: GroupNode } = {};
  for (const node of nodes) {
    const nodePos = nodePositions[node.id];
    if (!nodePos) continue;

    const nodeElement = await createDiagramNode(node, {
      x: position.x + nodePos.x,
      y: position.y + nodePos.y
    }, nodeStyle);
    
    nodeElements[node.id] = nodeElement;
    elements.push(nodeElement);
  }

  // Create connections
  for (const connection of connections) {
    const fromNode = nodeElements[connection.from];
    const toNode = nodeElements[connection.to];
    
    if (fromNode && toNode) {
      const connector = await createDiagramConnection(fromNode, toNode, connection, connectionStyle);
      if (connector) {
        elements.push(connector);
      }
    }
  }

  // Add title if provided
  if (title) {
    const titleText = figma.createText();
    titleText.characters = title;
    titleText.fontSize = 16;
    titleText.fontName = { family: 'Inter', style: 'Medium' };
    titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    titleText.x = position.x + size.width / 2 - titleText.width / 2;
    titleText.y = position.y - 30;
    elements.push(titleText);
  }

  // Group all elements
  const diagramGroup = figma.group(elements, figma.currentPage);
  diagramGroup.name = `${type} Diagram${title ? `: ${title}` : ''}`;

  return {
    elementId: diagramGroup.id,
    type: 'diagram',
    diagramType: type
  };
}

/**
 * Create custom visualizations and dashboards
 */
export async function createVisualization(options: CreateVisualizationOptions): Promise<{ elementId: string; type: string; visualizationType: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    type,
    elements: vizElements,
    position = { x: 0, y: 0 },
    size = { width: 800, height: 600 },
    title,
    layout = 'GRID',
    theme = 'LIGHT',
    responsive = false
  } = options;

  console.log(`[createVisualization] Creating ${type} visualization with ${vizElements.length} elements`);

  // Load font first
  await loadFontWithFallback();

  const elements: SceneNode[] = [];
  const themeColors = getThemeColors(theme);

  // Create main container
  const container = figma.createFrame();
  container.name = `${type} Visualization${title ? `: ${title}` : ''}`;
  container.x = position.x;
  container.y = position.y;
  container.resize(size.width, size.height);
  container.fills = [{ type: 'SOLID', color: themeColors.background }];
  elements.push(container);

  // Add title if provided
  let contentArea = { x: 20, y: 20, width: size.width - 40, height: size.height - 40 };
  
  if (title) {
    const titleText = figma.createText();
    titleText.characters = title;
    titleText.fontSize = 20;
    titleText.fontName = { family: 'Inter', style: 'Bold' };
    titleText.fills = [{ type: 'SOLID', color: themeColors.primary }];
    titleText.x = position.x + 20;
    titleText.y = position.y + 20;
    elements.push(titleText);
    
    contentArea.y += 50;
    contentArea.height -= 50;
  }

  // Calculate layout for visualization elements
  const elementPositions = calculateVisualizationLayout(vizElements, contentArea, layout, responsive);

  // Create visualization elements
  for (let i = 0; i < vizElements.length; i++) {
    const element = vizElements[i];
    const elementPos = elementPositions[i];
    
    if (!elementPos) continue;

    let vizElement: SceneNode | null = null;

    switch (element.type) {
      case 'CHART':
        // Create embedded chart
        vizElement = await createEmbeddedChart(element.data, {
          x: position.x + elementPos.x,
          y: position.y + elementPos.y,
          width: elementPos.width,
          height: elementPos.height
        }, themeColors);
        break;
      
      case 'METRIC':
        // Create metric display
        vizElement = await createMetricDisplay(element.data, {
          x: position.x + elementPos.x,
          y: position.y + elementPos.y,
          width: elementPos.width,
          height: elementPos.height
        }, themeColors);
        break;
      
      case 'TEXT':
        // Create formatted text
        vizElement = await createFormattedText(element.data, {
          x: position.x + elementPos.x,
          y: position.y + elementPos.y,
          width: elementPos.width,
          height: elementPos.height
        }, themeColors);
        break;
      
      case 'SHAPE':
        // Create decorative shape
        vizElement = await createVisualizationShape(element.data, {
          x: position.x + elementPos.x,
          y: position.y + elementPos.y,
          width: elementPos.width,
          height: elementPos.height
        }, themeColors);
        break;
    }

    if (vizElement) {
      elements.push(vizElement);
    }
  }

  // Group all elements
  const visualizationGroup = figma.group(elements, figma.currentPage);
  visualizationGroup.name = `${type} Visualization${title ? `: ${title}` : ''}`;

  return {
    elementId: visualizationGroup.id,
    type: 'visualization',
    visualizationType: type
  };
}

// Helper functions for chart creation

/**
 * Generate color scheme for charts
 */
function generateColorScheme(count: number, scheme: string): Array<{ r: number; g: number; b: number }> {
  const schemes = {
    BLUE: [{ r: 0.2, g: 0.4, b: 0.8 }, { r: 0.4, g: 0.6, b: 0.9 }, { r: 0.6, g: 0.8, b: 1 }],
    GREEN: [{ r: 0.2, g: 0.6, b: 0.3 }, { r: 0.4, g: 0.8, b: 0.5 }, { r: 0.6, g: 1, b: 0.7 }],
    RED: [{ r: 0.8, g: 0.2, b: 0.2 }, { r: 0.9, g: 0.4, b: 0.4 }, { r: 1, g: 0.6, b: 0.6 }],
    PURPLE: [{ r: 0.6, g: 0.2, b: 0.8 }, { r: 0.7, g: 0.4, b: 0.9 }, { r: 0.8, g: 0.6, b: 1 }],
    ORANGE: [{ r: 1, g: 0.6, b: 0.2 }, { r: 1, g: 0.7, b: 0.4 }, { r: 1, g: 0.8, b: 0.6 }],
    MULTI: [
      { r: 0.2, g: 0.4, b: 0.8 }, { r: 0.8, g: 0.2, b: 0.2 }, { r: 0.2, g: 0.6, b: 0.3 },
      { r: 1, g: 0.6, b: 0.2 }, { r: 0.6, g: 0.2, b: 0.8 }, { r: 0.8, g: 0.8, b: 0.2 },
      { r: 0.2, g: 0.8, b: 0.8 }, { r: 0.8, g: 0.2, b: 0.8 }
    ]
  };

  const baseColors = (schemes as any)[scheme] || schemes.MULTI;
  const colors: Array<{ r: number; g: number; b: number }> = [];

  for (let i = 0; i < count; i++) {
    const baseIndex = i % baseColors.length;
    const variation = Math.floor(i / baseColors.length) * 0.1;
    const color = baseColors[baseIndex];
    
    colors.push({
      r: Math.max(0, Math.min(1, color.r + variation)),
      g: Math.max(0, Math.min(1, color.g + variation)),
      b: Math.max(0, Math.min(1, color.b + variation))
    });
  }

  return colors;
}

/**
 * Create bar chart elements
 */
async function createBarChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  showAxes: boolean,
  showGrid: boolean,
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  if (data.length === 0) return elements;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (area.width - 40) / data.length - 10;
  const barSpacing = 10;

  // Create bars
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const barHeight = (item.value / maxValue) * (area.height - 40);
    
    const bar = figma.createRectangle();
    bar.x = area.x + 20 + i * (barWidth + barSpacing);
    bar.y = area.y + area.height - 20 - barHeight;
    bar.resize(barWidth, barHeight);
    bar.fills = [{ type: 'SOLID', color: item.color! }];
    bar.name = `Bar: ${item.label}`;
    elements.push(bar);

    // Add value labels
    const valueLabel = figma.createText();
    valueLabel.characters = item.value.toString();
    valueLabel.fontSize = fontSize - 2;
    valueLabel.fontName = { family: fontFamily, style: 'Regular' };
    valueLabel.fills = [{ type: 'SOLID', color: textColor }];
    valueLabel.x = bar.x + barWidth / 2 - valueLabel.width / 2;
    valueLabel.y = bar.y - 20;
    elements.push(valueLabel);

    // Add category labels
    const categoryLabel = figma.createText();
    categoryLabel.characters = item.label;
    categoryLabel.fontSize = fontSize - 1;
    categoryLabel.fontName = { family: fontFamily, style: 'Regular' };
    categoryLabel.fills = [{ type: 'SOLID', color: textColor }];
    categoryLabel.x = bar.x + barWidth / 2 - categoryLabel.width / 2;
    categoryLabel.y = area.y + area.height + 5;
    elements.push(categoryLabel);
  }

  return elements;
}

/**
 * Create line chart elements  
 */
async function createLineChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  showAxes: boolean,
  showGrid: boolean,
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  if (data.length < 2) return elements;

  const maxValue = Math.max(...data.map(d => d.value));
  const stepX = (area.width - 40) / (data.length - 1);

  // Create line path (simplified as connected rectangles)
  for (let i = 0; i < data.length - 1; i++) {
    const point1 = {
      x: area.x + 20 + i * stepX,
      y: area.y + area.height - 20 - (data[i].value / maxValue) * (area.height - 40)
    };
    const point2 = {
      x: area.x + 20 + (i + 1) * stepX,
      y: area.y + area.height - 20 - (data[i + 1].value / maxValue) * (area.height - 40)
    };

    // Create line segment
    const line = figma.createLine();
    line.x = point1.x;
    line.y = point1.y;
    line.resizeWithoutConstraints(point2.x - point1.x, point2.y - point1.y);
    line.strokes = [{ type: 'SOLID', color: data[0].color! }];
    line.strokeWeight = 3;
    elements.push(line);

    // Create data points
    const circle = figma.createEllipse();
    circle.x = point1.x - 3;
    circle.y = point1.y - 3;
    circle.resize(6, 6);
    circle.fills = [{ type: 'SOLID', color: data[0].color! }];
    elements.push(circle);
  }

  // Add last point
  const lastPoint = {
    x: area.x + 20 + (data.length - 1) * stepX,
    y: area.y + area.height - 20 - (data[data.length - 1].value / maxValue) * (area.height - 40)
  };
  const lastCircle = figma.createEllipse();
  lastCircle.x = lastPoint.x - 3;
  lastCircle.y = lastPoint.y - 3;
  lastCircle.resize(6, 6);
  lastCircle.fills = [{ type: 'SOLID', color: data[0].color! }];
  elements.push(lastCircle);

  return elements;
}

/**
 * Create pie chart elements
 */
async function createPieChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  if (data.length === 0) return elements;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.min(area.width, area.height) / 2 - 40;
  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height / 2;

  let currentAngle = -Math.PI / 2; // Start at top

  // Create pie slices (simplified as triangular approximations)
  for (const item of data) {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Create slice using polygon (simplified approach)
    const slice = figma.createPolygon();
    slice.pointCount = Math.max(3, Math.ceil(sliceAngle / (Math.PI / 6))); // More points for larger slices
    slice.x = centerX - radius / 2;
    slice.y = centerY - radius / 2;
    slice.resize(radius, radius);
    slice.fills = [{ type: 'SOLID', color: item.color! }];
    slice.rotation = currentAngle + sliceAngle / 2;
    slice.name = `Pie Slice: ${item.label}`;
    elements.push(slice);

    // Add percentage labels
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;

    const percentage = Math.round((item.value / total) * 100);
    const label = figma.createText();
    label.characters = `${percentage}%`;
    label.fontSize = fontSize;
    label.fontName = { family: fontFamily, style: 'Medium' };
    label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    label.x = labelX - label.width / 2;
    label.y = labelY - label.height / 2;
    elements.push(label);

    currentAngle += sliceAngle;
  }

  return elements;
}

/**
 * Create scatter chart elements
 */
async function createScatterChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  showAxes: boolean,
  showGrid: boolean,
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  if (data.length === 0) return elements;

  const maxValue = Math.max(...data.map(d => d.value));

  // Create scatter points
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const x = area.x + 20 + (i / (data.length - 1)) * (area.width - 40);
    const y = area.y + area.height - 20 - (item.value / maxValue) * (area.height - 40);

    const point = figma.createEllipse();
    point.x = x - 4;
    point.y = y - 4;
    point.resize(8, 8);
    point.fills = [{ type: 'SOLID', color: item.color! }];
    point.name = `Point: ${item.label}`;
    elements.push(point);
  }

  return elements;
}

/**
 * Create area chart elements
 */
async function createAreaChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  showAxes: boolean,
  showGrid: boolean,
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  if (data.length === 0) return elements;

  const maxValue = Math.max(...data.map(d => d.value));
  const stepX = (area.width - 40) / (data.length - 1);

  // Create area shape (simplified as polygon)
  const areaShape = figma.createPolygon();
  areaShape.pointCount = data.length + 2; // +2 for baseline points
  areaShape.x = area.x + 20;
  areaShape.y = area.y + 20;
  areaShape.resize(area.width - 40, area.height - 40);
  
  const color = data[0].color!;
  areaShape.fills = [{ type: 'SOLID', color, opacity: 0.3 }];
  areaShape.strokes = [{ type: 'SOLID', color }];
  areaShape.strokeWeight = 2;
  elements.push(areaShape);

  return elements;
}

/**
 * Create donut chart elements
 */
async function createDonutChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  
  // Create pie chart first
  const pieElements = await createPieChart(data, area, textColor, fontSize, fontFamily);
  elements.push(...pieElements);

  // Add center hole
  const radius = Math.min(area.width, area.height) / 2 - 40;
  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height / 2;
  const holeRadius = radius * 0.5;

  const hole = figma.createEllipse();
  hole.x = centerX - holeRadius;
  hole.y = centerY - holeRadius;
  hole.resize(holeRadius * 2, holeRadius * 2);
  hole.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  elements.push(hole);

  return elements;
}

/**
 * Create histogram chart elements
 */
async function createHistogramChart(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  showAxes: boolean,
  showGrid: boolean,
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  // Histogram is similar to bar chart but with continuous data
  return await createBarChart(data, area, showAxes, showGrid, textColor, fontSize, fontFamily);
}

/**
 * Create chart legend
 */
async function createChartLegend(
  data: ChartData[], 
  area: { x: number; y: number; width: number; height: number },
  textColor: { r: number; g: number; b: number },
  fontSize: number,
  fontFamily: string
): Promise<SceneNode[]> {
  const elements: SceneNode[] = [];
  const itemHeight = 20;

  for (let i = 0; i < data.length && i * itemHeight < area.height; i++) {
    const item = data[i];
    const y = area.y + i * itemHeight;

    // Color indicator
    const colorRect = figma.createRectangle();
    colorRect.x = area.x;
    colorRect.y = y + 2;
    colorRect.resize(16, 16);
    colorRect.fills = [{ type: 'SOLID', color: item.color! }];
    elements.push(colorRect);

    // Label
    const label = figma.createText();
    label.characters = item.label;
    label.fontSize = fontSize;
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.fills = [{ type: 'SOLID', color: textColor }];
    label.x = area.x + 20;
    label.y = y;
    elements.push(label);
  }

  return elements;
}

// Helper functions for diagrams

/**
 * Calculate layout positions for diagram nodes
 */
function calculateDiagramLayout(
  nodes: DiagramNode[], 
  connections: DiagramConnection[], 
  layout: string, 
  spacing: { x: number; y: number },
  size: Size
): { [key: string]: Position } {
  const positions: { [key: string]: Position } = {};

  switch (layout) {
    case 'TOP_DOWN':
      return calculateTopDownLayout(nodes, spacing);
    case 'LEFT_RIGHT':
      return calculateLeftRightLayout(nodes, spacing);
    case 'RADIAL':
      return calculateRadialLayout(nodes, size);
    case 'CIRCULAR':
      return calculateCircularLayout(nodes, size);
    case 'MATRIX':
      return calculateMatrixLayout(nodes, spacing);
    default:
      return calculateAutoLayout(nodes, connections, spacing, size);
  }
}

function calculateTopDownLayout(nodes: DiagramNode[], spacing: { x: number; y: number }): { [key: string]: Position } {
  const positions: { [key: string]: Position } = {};
  const levels: { [level: number]: DiagramNode[] } = {};

  // Group nodes by level
  for (const node of nodes) {
    const level = node.level || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  }

  // Position nodes
  let currentY = 0;
  for (const level in levels) {
    const levelNodes = levels[level];
    const startX = -(levelNodes.length - 1) * spacing.x / 2;

    for (let i = 0; i < levelNodes.length; i++) {
      positions[levelNodes[i].id] = {
        x: startX + i * spacing.x,
        y: currentY
      };
    }
    currentY += spacing.y;
  }

  return positions;
}

function calculateLeftRightLayout(nodes: DiagramNode[], spacing: { x: number; y: number }): { [key: string]: Position } {
  const positions: { [key: string]: Position } = {};
  const levels: { [level: number]: DiagramNode[] } = {};

  // Group nodes by level
  for (const node of nodes) {
    const level = node.level || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  }

  // Position nodes
  let currentX = 0;
  for (const level in levels) {
    const levelNodes = levels[level];
    const startY = -(levelNodes.length - 1) * spacing.y / 2;

    for (let i = 0; i < levelNodes.length; i++) {
      positions[levelNodes[i].id] = {
        x: currentX,
        y: startY + i * spacing.y
      };
    }
    currentX += spacing.x;
  }

  return positions;
}

function calculateRadialLayout(nodes: DiagramNode[], size: Size): { [key: string]: Position } {
  const positions: { [key: string]: Position } = {};
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const radius = Math.min(size.width, size.height) / 2 - 50;

  for (let i = 0; i < nodes.length; i++) {
    const angle = (i / nodes.length) * 2 * Math.PI;
    positions[nodes[i].id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }

  return positions;
}

function calculateCircularLayout(nodes: DiagramNode[], size: Size): { [key: string]: Position } {
  return calculateRadialLayout(nodes, size); // Same as radial for now
}

function calculateMatrixLayout(nodes: DiagramNode[], spacing: { x: number; y: number }): { [key: string]: Position } {
  const positions: { [key: string]: Position } = {};
  const cols = Math.ceil(Math.sqrt(nodes.length));

  for (let i = 0; i < nodes.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions[nodes[i].id] = {
      x: col * spacing.x,
      y: row * spacing.y
    };
  }

  return positions;
}

function calculateAutoLayout(
  nodes: DiagramNode[], 
  connections: DiagramConnection[], 
  spacing: { x: number; y: number },
  size: Size
): { [key: string]: Position } {
  // Default to top-down if we have level information, otherwise use matrix
  const hasLevels = nodes.some(node => node.level !== undefined);
  
  if (hasLevels) {
    return calculateTopDownLayout(nodes, spacing);
  } else {
    return calculateMatrixLayout(nodes, spacing);
  }
}

/**
 * Create a diagram node
 */
async function createDiagramNode(
  node: DiagramNode, 
  position: Position, 
  style: NodeStyle
): Promise<GroupNode> {
  const {
    backgroundColor = { r: 0.9, g: 0.9, b: 0.9 },
    textColor = { r: 0.2, g: 0.2, b: 0.2 },
    borderColor = { r: 0.7, g: 0.7, b: 0.7 },
    borderWidth = 1,
    cornerRadius = 8,
    fontSize = 12,
    fontFamily = 'Inter',
    padding = 12
  } = style;

  // Create background shape
  const background = figma.createRectangle();
  background.cornerRadius = cornerRadius;
  background.fills = [{ type: 'SOLID', color: node.color || backgroundColor }];
  background.strokes = [{ type: 'SOLID', color: borderColor }];
  background.strokeWeight = borderWidth;

  // Create text
  const text = figma.createText();
  text.characters = node.label;
  text.fontSize = fontSize;
  text.fontName = { family: fontFamily, style: 'Regular' };
  text.fills = [{ type: 'SOLID', color: textColor }];
  text.textAlignHorizontal = 'CENTER';
  text.textAlignVertical = 'CENTER';

  // Size background to fit text with padding
  const textWidth = text.width;
  const textHeight = text.height;
  const bgWidth = Math.max(80, textWidth + padding * 2);
  const bgHeight = Math.max(40, textHeight + padding * 2);

  background.resize(bgWidth, bgHeight);
  background.x = position.x;
  background.y = position.y;

  text.x = position.x + bgWidth / 2 - textWidth / 2;
  text.y = position.y + bgHeight / 2 - textHeight / 2;

  // Group elements
  const group = figma.group([background, text], figma.currentPage);
  group.name = `Node: ${node.label}`;

  return group;
}

/**
 * Create a diagram connection
 */
async function createDiagramConnection(
  fromNode: GroupNode, 
  toNode: GroupNode, 
  connection: DiagramConnection,
  style: ConnectionStyle
): Promise<ConnectorNode | null> {
  const {
    strokeColor = { r: 0.5, g: 0.5, b: 0.5 },
    strokeWeight = 2,
    strokeStyle = 'SOLID'
  } = style;

  try {
    // Create connector
    const connector = figma.createConnector();
    
    connector.connectorStart = {
      endpointNodeId: fromNode.id,
      magnet: "AUTO"
    };
    
    connector.connectorEnd = {
      endpointNodeId: toNode.id,
      magnet: "AUTO"
    };

    connector.strokes = [{ type: 'SOLID', color: strokeColor }];
    connector.strokeWeight = strokeWeight;

    // Apply stroke style
    if (strokeStyle === 'DASHED') {
      (connector as any).dashPattern = [5, 5];
    } else if (strokeStyle === 'DOTTED') {
      (connector as any).dashPattern = [2, 3];
    }

    connector.name = `Connection: ${connection.from} → ${connection.to}`;
    
    return connector;
  } catch (error) {
    console.warn("Could not create connector:", error);
    return null;
  }
}

// Helper functions for visualizations

/**
 * Calculate layout for visualization elements
 */
function calculateVisualizationLayout(
  elements: VisualizationElement[], 
  area: { x: number; y: number; width: number; height: number },
  layout: string,
  responsive: boolean
): Array<{ x: number; y: number; width: number; height: number }> {
  const positions: Array<{ x: number; y: number; width: number; height: number }> = [];

  switch (layout) {
    case 'GRID':
      const cols = Math.ceil(Math.sqrt(elements.length));
      const cellWidth = area.width / cols;
      const cellHeight = area.height / Math.ceil(elements.length / cols);
      
      for (let i = 0; i < elements.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions.push({
          x: area.x + col * cellWidth + 10,
          y: area.y + row * cellHeight + 10,
          width: cellWidth - 20,
          height: cellHeight - 20
        });
      }
      break;
      
    case 'FLOW':
      let currentX = area.x + 10;
      let currentY = area.y + 10;
      const rowHeight = area.height / Math.ceil(elements.length / 3);
      
      for (let i = 0; i < elements.length; i++) {
        const width = area.width / 3 - 20;
        
        if (currentX + width > area.x + area.width) {
          currentX = area.x + 10;
          currentY += rowHeight;
        }
        
        positions.push({
          x: currentX,
          y: currentY,
          width,
          height: rowHeight - 20
        });
        
        currentX += width + 20;
      }
      break;
      
    default: // LAYERED
      for (let i = 0; i < elements.length; i++) {
        positions.push({
          x: area.x + 10,
          y: area.y + i * (area.height / elements.length) + 10,
          width: area.width - 20,
          height: (area.height / elements.length) - 20
        });
      }
  }

  return positions;
}

/**
 * Get theme colors
 */
function getThemeColors(theme: string): {
  background: { r: number; g: number; b: number };
  primary: { r: number; g: number; b: number };
  secondary: { r: number; g: number; b: number };
  accent: { r: number; g: number; b: number };
} {
  const themes = {
    LIGHT: {
      background: { r: 1, g: 1, b: 1 },
      primary: { r: 0.2, g: 0.2, b: 0.2 },
      secondary: { r: 0.6, g: 0.6, b: 0.6 },
      accent: { r: 0.2, g: 0.4, b: 0.8 }
    },
    DARK: {
      background: { r: 0.1, g: 0.1, b: 0.1 },
      primary: { r: 0.9, g: 0.9, b: 0.9 },
      secondary: { r: 0.6, g: 0.6, b: 0.6 },
      accent: { r: 0.4, g: 0.6, b: 1 }
    },
    COLORFUL: {
      background: { r: 0.95, g: 0.95, b: 1 },
      primary: { r: 0.2, g: 0.2, b: 0.4 },
      secondary: { r: 0.5, g: 0.5, b: 0.7 },
      accent: { r: 1, g: 0.3, b: 0.5 }
    },
    MINIMAL: {
      background: { r: 0.98, g: 0.98, b: 0.98 },
      primary: { r: 0.3, g: 0.3, b: 0.3 },
      secondary: { r: 0.7, g: 0.7, b: 0.7 },
      accent: { r: 0, g: 0, b: 0 }
    }
  };

  return (themes as any)[theme] || themes.LIGHT;
}

/**
 * Create embedded chart for visualization
 */
async function createEmbeddedChart(
  data: any, 
  area: { x: number; y: number; width: number; height: number },
  themeColors: any
): Promise<SceneNode> {
  // This would create a smaller, embedded chart
  const chartData = Array.isArray(data.data) ? data.data : [
    { label: 'A', value: 10 },
    { label: 'B', value: 20 },
    { label: 'C', value: 15 }
  ];

  const chart = await createChart({
    type: data.type || 'BAR',
    data: chartData,
    position: { x: area.x, y: area.y },
    size: { width: area.width, height: area.height },
    showLegend: false,
    backgroundColor: themeColors.background,
    textColor: themeColors.primary,
    fontSize: 10
  });

  return figma.getNodeById(chart.elementId) as SceneNode;
}

/**
 * Create metric display
 */
async function createMetricDisplay(
  data: any, 
  area: { x: number; y: number; width: number; height: number },
  themeColors: any
): Promise<SceneNode> {
  const background = figma.createRectangle();
  background.x = area.x;
  background.y = area.y;
  background.resize(area.width, area.height);
  background.fills = [{ type: 'SOLID', color: themeColors.background }];
  background.cornerRadius = 8;

  const valueText = figma.createText();
  valueText.characters = data.value?.toString() || '0';
  valueText.fontSize = Math.min(32, area.height / 3);
  valueText.fontName = { family: 'Inter', style: 'Bold' };
  valueText.fills = [{ type: 'SOLID', color: themeColors.accent }];
  valueText.textAlignHorizontal = 'CENTER';

  const labelText = figma.createText();
  labelText.characters = data.label || 'Metric';
  labelText.fontSize = 14;
  labelText.fontName = { family: 'Inter', style: 'Regular' };
  labelText.fills = [{ type: 'SOLID', color: themeColors.secondary }];
  labelText.textAlignHorizontal = 'CENTER';

  valueText.x = area.x + area.width / 2 - valueText.width / 2;
  valueText.y = area.y + area.height / 2 - valueText.height / 2 - 10;

  labelText.x = area.x + area.width / 2 - labelText.width / 2;
  labelText.y = valueText.y + valueText.height + 5;

  const group = figma.group([background, valueText, labelText], figma.currentPage);
  return group;
}

/**
 * Create formatted text
 */
async function createFormattedText(
  data: any, 
  area: { x: number; y: number; width: number; height: number },
  themeColors: any
): Promise<SceneNode> {
  const text = figma.createText();
  text.characters = data.text || 'Sample text';
  text.fontSize = data.fontSize || 14;
  text.fontName = { family: data.fontFamily || 'Inter', style: data.fontWeight || 'Regular' };
  text.fills = [{ type: 'SOLID', color: themeColors.primary }];
  text.textAlignHorizontal = data.align || 'LEFT';
  
  text.x = area.x;
  text.y = area.y;
  text.resize(area.width, area.height);

  return text;
}

/**
 * Create visualization shape
 */
async function createVisualizationShape(
  data: any, 
  area: { x: number; y: number; width: number; height: number },
  themeColors: any
): Promise<SceneNode> {
  let shape: SceneNode;

  switch (data.shape || 'rectangle') {
    case 'circle':
      shape = figma.createEllipse();
      break;
    case 'triangle':
      shape = figma.createPolygon();
      (shape as PolygonNode).pointCount = 3;
      break;
    default:
      shape = figma.createRectangle();
      (shape as RectangleNode).cornerRadius = data.cornerRadius || 0;
  }

  shape.x = area.x;
  shape.y = area.y;
  shape.resize(area.width, area.height);
  shape.fills = [{ type: 'SOLID', color: data.color || themeColors.accent }];

  return shape;
}