import { on, showUI, emit } from "@create-figma-plugin/utilities";
import { CloseHandler } from "./types/index";
import { UI_CONFIG } from "./constants";

export default function () {
  console.log("[main.ts] Plugin Main Thread Started");

  const uiOptions = {
    width: UI_CONFIG.WINDOW_WIDTH,
    height: UI_CONFIG.WINDOW_HEIGHT,
  };
  showUI(uiOptions);
  console.log("[main.ts] UI Shown", uiOptions);

  // Handle Plugin Close Request
  on<CloseHandler>("CLOSE", () => {
    console.log("[main.ts] Plugin Close Requested");
    figma.closePlugin();
  });

  // Handle Figma API calls from backend
  figma.ui.onmessage = async (msg) => {
    console.log("[main.ts] Received message from UI:", msg);

    try {
      if (msg.type === "FIGMA_API_CALL") {
        await handleFigmaAPICall(msg);
      }
    } catch (error) {
      console.error("[main.ts] Error handling message:", error);
      figma.ui.postMessage({
        type: "FIGMA_API_RESPONSE",
        id: msg.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  console.log("[main.ts] Event listeners ready.");
}

/**
 * Handle Figma API calls from backend
 */
async function handleFigmaAPICall(msg: any): Promise<void> {
  const { id, action, data } = msg;

  console.log(`[main.ts] Handling Figma API call: ${action}`, data);

  try {
    switch (action) {
      // Page information
      case "get_current_page_info":
        await handleGetCurrentPageInfo(id);
        break;

      case "query_elements":
        await handleQueryElements(id, data);
        break;

      case "get_element_details":
        await handleGetElementDetails(id, data);
        break;

      case "get_page_statistics":
        await handleGetPageStatistics(id);
        break;

      // Element creation
      case "create_sticky_note":
        await handleCreateStickyNote(id, data);
        break;

      case "create_rectangle":
        await handleCreateRectangle(id, data);
        break;

      case "create_ellipse":
        await handleCreateEllipse(id, data);
        break;

      case "create_text":
        await handleCreateText(id, data);
        break;

      case "create_connector":
        await handleCreateConnector(id, data);
        break;

      // Element management
      case "delete_element":
        await handleDeleteElement(id, data);
        break;

      case "delete_elements":
        await handleDeleteElements(id, data);
        break;

      case "update_element":
        await handleUpdateElement(id, data);
        break;

      case "select_elements":
        await handleSelectElements(id, data);
        break;

      case "duplicate_element":
        await handleDuplicateElement(id, data);
        break;

      case "arrange_elements":
        await handleArrangeElements(id, data);
        break;

      // Legacy support
      case "get_document_info":
        await handleGetDocumentInfo(id);
        break;

      default:
        throw new Error(`Unknown Figma API action: ${action}`);
    }
  } catch (error) {
    console.error(`[main.ts] Error in ${action}:`, error);
    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Create a sticky note in FigJam
 */
async function handleCreateStickyNote(id: string, data: any): Promise<void> {
  // Validate that we're in FigJam
  if (figma.editorType !== "figjam") {
    throw new Error("Sticky notes can only be created in FigJam");
  }

  console.log("[main.ts] Creating sticky note with data:", data);

  // Create the sticky note
  const sticky = figma.createSticky();

  // Set position
  sticky.x = data.x || 100;
  sticky.y = data.y || 100;

  // Load font before setting text (try multiple font styles)
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  } catch (error) {
    console.log("[main.ts] Inter Medium not available, trying Regular");
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (error2) {
      console.log("[main.ts] Inter Regular not available, using default");
      // Use Figma's default font as fallback
      await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    }
  }

  // Set wide width if requested (StickyNode doesn't support custom resize)
  if (data.width && data.width > 300) {
    sticky.isWideWidth = true;
  }

  // Set text content
  sticky.text.characters = data.text || "";

  // Set color if provided
  if (data.color) {
    const colorMap: Record<string, RGB> = {
      yellow: { r: 1, g: 0.9, b: 0.2 },
      blue: { r: 0.2, g: 0.6, b: 1 },
      green: { r: 0.2, g: 0.8, b: 0.4 },
      pink: { r: 1, g: 0.4, b: 0.7 },
      purple: { r: 0.7, g: 0.4, b: 1 },
    };

    const color = colorMap[data.color.toLowerCase()];
    if (color) {
      sticky.fills = [
        {
          type: "SOLID",
          color: color,
        },
      ];
    }
  }

  // Select the created sticky
  figma.currentPage.selection = [sticky];

  // Zoom to fit the sticky
  figma.viewport.scrollAndZoomIntoView([sticky]);

  // Send success response
  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      stickyId: sticky.id,
      message: `Created sticky note: "${data.text}"`,
    },
  });

  console.log("[main.ts] Sticky note created successfully:", sticky.id);
}

/**
 * Get document information
 */
async function handleGetDocumentInfo(id: string): Promise<void> {
  const info = {
    documentName: figma.root.name,
    currentPageName: figma.currentPage.name,
    editorType: figma.editorType,
    selectionCount: figma.currentPage.selection.length,
    timestamp: Date.now(),
  };

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: info,
  });

  console.log("[main.ts] Document info retrieved:", info);
}

// ========================================
// Page Information Handlers
// ========================================

/**
 * Get current page information with all elements
 */
async function handleGetCurrentPageInfo(id: string): Promise<void> {
  const elements: any[] = [];
  
  // Function to convert Figma node to our element format
  function convertNodeToElement(node: SceneNode): any {
    const element: any = {
      id: node.id,
      type: node.type,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: (node as any).rotation || 0,
      opacity: (node as any).opacity || 1,
      visible: node.visible,
      locked: node.locked,
    };

    // Add fills and strokes if available
    if ('fills' in node) {
      element.fills = node.fills;
    }
    if ('strokes' in node) {
      element.strokes = node.strokes;
    }
    if ('effects' in node) {
      element.effects = node.effects;
    }
    if ('cornerRadius' in node) {
      element.cornerRadius = node.cornerRadius;
    }

    // Add text-specific properties
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      element.text = textNode.characters;
      element.fontSize = textNode.fontSize;
      element.fontFamily = textNode.fontName;
    } else if (node.type === 'STICKY') {
      const stickyNode = node as StickyNode;
      element.text = stickyNode.text.characters;
    }

    return element;
  }

  // Function to recursively traverse nodes
  function traverseNode(node: SceneNode): void {
    elements.push(convertNodeToElement(node));
    
    // Recursively process children
    if ('children' in node) {
      node.children.forEach(child => traverseNode(child as SceneNode));
    }
  }

  // Traverse all children of current page
  figma.currentPage.children.forEach(child => traverseNode(child as SceneNode));

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

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: pageInfo,
  });

  console.log("[main.ts] Page info retrieved:", pageInfo);
}

/**
 * Query elements by filters
 */
async function handleQueryElements(id: string, data: any): Promise<void> {
  // First get all elements
  await handleGetCurrentPageInfo(id + '_temp');
  
  // For now, return all elements - client will do filtering
  // In a real implementation, we'd filter here based on data.types, data.names, etc.
  await handleGetCurrentPageInfo(id);
}

/**
 * Get detailed information about a specific element
 */
async function handleGetElementDetails(id: string, data: any): Promise<void> {
  const { elementId } = data;
  
  try {
    const node = figma.getNodeById(elementId) as SceneNode;
    
    if (!node) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const element: any = {
      id: node.id,
      type: node.type,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: (node as any).rotation || 0,
      opacity: (node as any).opacity || 1,
      visible: node.visible,
      locked: node.locked,
    };

    // Add additional properties based on node type
    if ('fills' in node) {
      element.fills = node.fills;
    }
    if ('strokes' in node) {
      element.strokes = node.strokes;
    }
    if ('effects' in node) {
      element.effects = node.effects;
    }
    if ('cornerRadius' in node) {
      element.cornerRadius = node.cornerRadius;
    }

    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      element.text = textNode.characters;
      element.fontSize = textNode.fontSize;
      element.fontName = textNode.fontName;
    } else if (node.type === 'STICKY') {
      const stickyNode = node as StickyNode;
      element.text = stickyNode.text.characters;
    }

    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: true,
      result: element,
    });

    console.log("[main.ts] Element details retrieved:", element);
  } catch (error) {
    throw new Error(`Failed to get element details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get page statistics
 */
async function handleGetPageStatistics(id: string): Promise<void> {
  const elements: any[] = [];
  
  // Collect all elements
  function traverseNode(node: SceneNode): void {
    elements.push({
      type: node.type,
      visible: node.visible,
      locked: node.locked,
      width: node.width,
      height: node.height,
    });
    
    if ('children' in node) {
      node.children.forEach(child => traverseNode(child as SceneNode));
    }
  }

  figma.currentPage.children.forEach(child => traverseNode(child as SceneNode));

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

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: statistics,
  });

  console.log("[main.ts] Page statistics:", statistics);
}

// ========================================
// Element Creation Handlers
// ========================================

/**
 * Create a rectangle shape
 */
async function handleCreateRectangle(id: string, data: any): Promise<void> {
  console.log("[main.ts] Creating rectangle with data:", data);

  const rectangle = figma.createRectangle();
  
  // Set position and size
  rectangle.x = data.x || 0;
  rectangle.y = data.y || 0;
  rectangle.resize(data.width || 100, data.height || 100);
  
  // Set name
  if (data.name) {
    rectangle.name = data.name;
  }
  
  // Set fills
  if (data.fills) {
    rectangle.fills = data.fills;
  }
  
  // Set strokes
  if (data.strokes) {
    rectangle.strokes = data.strokes;
  }
  
  // Set corner radius
  if (data.cornerRadius !== undefined) {
    rectangle.cornerRadius = data.cornerRadius;
  }

  // Select the created rectangle
  figma.currentPage.selection = [rectangle];
  figma.viewport.scrollAndZoomIntoView([rectangle]);

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId: rectangle.id,
      message: `Created rectangle: "${rectangle.name}"`,
    },
  });

  console.log("[main.ts] Rectangle created successfully:", rectangle.id);
}

/**
 * Create an ellipse shape
 */
async function handleCreateEllipse(id: string, data: any): Promise<void> {
  console.log("[main.ts] Creating ellipse with data:", data);

  const ellipse = figma.createEllipse();
  
  // Set position and size
  ellipse.x = data.x || 0;
  ellipse.y = data.y || 0;
  ellipse.resize(data.width || 100, data.height || 100);
  
  // Set name
  if (data.name) {
    ellipse.name = data.name;
  }
  
  // Set fills
  if (data.fills) {
    ellipse.fills = data.fills;
  }
  
  // Set strokes
  if (data.strokes) {
    ellipse.strokes = data.strokes;
  }

  // Select the created ellipse
  figma.currentPage.selection = [ellipse];
  figma.viewport.scrollAndZoomIntoView([ellipse]);

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId: ellipse.id,
      message: `Created ellipse: "${ellipse.name}"`,
    },
  });

  console.log("[main.ts] Ellipse created successfully:", ellipse.id);
}

/**
 * Create a text element
 */
async function handleCreateText(id: string, data: any): Promise<void> {
  console.log("[main.ts] Creating text with data:", data);

  const text = figma.createText();
  
  // Load font before setting text
  try {
    const fontFamily = data.fontFamily || "Inter";
    const fontWeight = data.fontWeight || "Regular";
    
    try {
      await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
    } catch (fontError) {
      console.log(`[main.ts] Font ${fontFamily} ${fontWeight} not available, using default`);
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    }
  } catch (error) {
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
  }

  // Set position
  text.x = data.x || 0;
  text.y = data.y || 0;
  
  // Set text content
  text.characters = data.text || "";
  
  // Set text properties
  if (data.fontSize) {
    text.fontSize = data.fontSize;
  }
  
  if (data.textAlign) {
    text.textAlignHorizontal = data.textAlign;
  }
  
  if (data.textColor) {
    text.fills = [{
      type: "SOLID",
      color: data.textColor,
    }];
  }
  
  // Set name
  if (data.name) {
    text.name = data.name;
  }

  // Set size if provided
  if (data.width || data.height) {
    text.resize(data.width || 200, data.height || 50);
  }

  // Select the created text
  figma.currentPage.selection = [text];
  figma.viewport.scrollAndZoomIntoView([text]);

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId: text.id,
      message: `Created text: "${data.text}"`,
    },
  });

  console.log("[main.ts] Text created successfully:", text.id);
}

/**
 * Create a connector between elements
 */
async function handleCreateConnector(id: string, data: any): Promise<void> {
  console.log("[main.ts] Creating connector with data:", data);

  // Note: FigJam connectors require both start and end elements to exist
  const startNode = figma.getNodeById(data.startElementId);
  const endNode = figma.getNodeById(data.endElementId);
  
  if (!startNode || !endNode) {
    throw new Error("Start or end element not found");
  }

  if (figma.editorType !== "figjam") {
    throw new Error("Connectors can only be created in FigJam");
  }

  // Create connector (FigJam specific)
  const connector = figma.createConnector();
  
  // Set connector endpoints
  connector.connectorStart = {
    endpointNodeId: data.startElementId,
    magnet: "AUTO",
  } as ConnectorEndpoint;
  
  connector.connectorEnd = {
    endpointNodeId: data.endElementId,
    magnet: "AUTO",
  } as ConnectorEndpoint;

  // Set stroke properties if provided
  if (data.strokeWeight) {
    connector.strokeWeight = data.strokeWeight;
  }
  
  if (data.strokeColor) {
    connector.strokes = [{
      type: "SOLID",
      color: data.strokeColor,
    }];
  }

  // Select the created connector
  figma.currentPage.selection = [connector];

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId: connector.id,
      message: `Created connector between elements`,
    },
  });

  console.log("[main.ts] Connector created successfully:", connector.id);
}

// ========================================
// Element Management Handlers
// ========================================

/**
 * Delete a single element
 */
async function handleDeleteElement(id: string, data: any): Promise<void> {
  const { elementId } = data;
  
  console.log("[main.ts] Deleting element:", elementId);
  
  const node = figma.getNodeById(elementId);
  
  if (!node) {
    throw new Error(`Element with ID ${elementId} not found`);
  }
  
  node.remove();

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      deletedIds: [elementId],
      message: `Deleted element: ${elementId}`,
    },
  });

  console.log("[main.ts] Element deleted successfully:", elementId);
}

/**
 * Delete multiple elements
 */
async function handleDeleteElements(id: string, data: any): Promise<void> {
  const { elementIds } = data;
  
  console.log("[main.ts] Deleting elements:", elementIds);
  
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

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      successful,
      failed,
      message: `Deleted ${successful.length} elements, ${failed.length} failed`,
    },
  });

  console.log("[main.ts] Bulk deletion completed:", { successful: successful.length, failed: failed.length });
}

/**
 * Update element properties
 */
async function handleUpdateElement(id: string, data: any): Promise<void> {
  const { elementId, properties } = data;
  
  console.log("[main.ts] Updating element:", elementId, properties);
  
  const node = figma.getNodeById(elementId) as SceneNode;
  
  if (!node) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

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

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId,
      updatedProperties: properties,
      message: `Updated element: ${elementId}`,
    },
  });

  console.log("[main.ts] Element updated successfully:", elementId);
}

/**
 * Select elements
 */
async function handleSelectElements(id: string, data: any): Promise<void> {
  const { elementIds } = data;
  
  console.log("[main.ts] Selecting elements:", elementIds);
  
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

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      selectedIds: nodes.map(n => n.id),
      message: `Selected ${nodes.length} elements`,
    },
  });

  console.log("[main.ts] Elements selected:", nodes.length);
}

/**
 * Duplicate an element
 */
async function handleDuplicateElement(id: string, data: any): Promise<void> {
  const { elementId, offsetX, offsetY } = data;
  
  console.log("[main.ts] Duplicating element:", elementId);
  
  const node = figma.getNodeById(elementId) as SceneNode;
  
  if (!node) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  const duplicate = (node as any).clone();
  duplicate.x = node.x + (offsetX || 20);
  duplicate.y = node.y + (offsetY || 20);

  // Add to same parent as original
  if (node.parent) {
    node.parent.appendChild(duplicate);
  }

  // Select the duplicate
  figma.currentPage.selection = [duplicate];
  figma.viewport.scrollAndZoomIntoView([duplicate]);

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      elementId: duplicate.id,
      message: `Duplicated element: ${elementId} -> ${duplicate.id}`,
    },
  });

  console.log("[main.ts] Element duplicated successfully:", duplicate.id);
}

/**
 * Arrange elements in layout
 */
async function handleArrangeElements(id: string, data: any): Promise<void> {
  const { elementIds, direction, spacing, padding, alignment, columns } = data;
  
  console.log("[main.ts] Arranging elements:", elementIds, direction);
  
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
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      successful: elementIds,
      failed: [],
      message: `Arranged ${nodes.length} elements in ${direction} layout`,
    },
  });

  console.log("[main.ts] Elements arranged successfully:", nodes.length);
}
