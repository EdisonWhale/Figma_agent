/**
 * Element Creation Handlers
 * Handles creation of basic elements like sticky notes, rectangles, ellipses, text, and connectors
 */

import { 
  loadFontWithFallback, 
  createSuccessResponse, 
  createErrorResponse, 
  getColorFill,
  selectAndFocus 
} from './utils';
import { 
  StickyNoteData, 
  ElementCreationData, 
  TextCreationData, 
  ConnectorData 
} from './types';

/**
 * Create a sticky note in FigJam
 */
export async function handleCreateStickyNote(id: string, data: StickyNoteData): Promise<void> {
  try {
    // Validate that we're in FigJam
    if (figma.editorType !== "figjam") {
      throw new Error("Sticky notes can only be created in FigJam");
    }

    console.log("[element-creation] Creating sticky note with data:", data);

    // Create the sticky note
    const sticky = figma.createSticky();

    // Set position
    sticky.x = data.x || 100;
    sticky.y = data.y || 100;

    // Load font before setting text
    await loadFontWithFallback();

    // Set wide width if requested
    if (data.width && data.width > 300) {
      sticky.isWideWidth = true;
    }

    // Set text content
    sticky.text.characters = data.text || "";

    // Set color if provided
    if (data.color) {
      const colorFill = getColorFill(data.color);
      if (colorFill) {
        sticky.fills = [colorFill];
      }
    }

    // Select and focus
    selectAndFocus([sticky]);

    const result = {
      elementId: sticky.id,
      stickyId: sticky.id,  // Keep for backward compatibility
      type: "STICKY",
      message: `Created sticky note: "${data.text}" (ID: ${sticky.id})`,
    };

    createSuccessResponse(id, result, "Sticky note created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_sticky_note");
    throw error;
  }
}

/**
 * Create a rectangle shape
 */
export async function handleCreateRectangle(id: string, data: ElementCreationData): Promise<void> {
  try {
    console.log("[element-creation] Creating rectangle with data:", data);

    const rectangle = figma.createRectangle();
    
    // Set position and size
    rectangle.x = data.x || 0;
    rectangle.y = data.y || 0;
    rectangle.resize(data.width || 100, data.height || 100);
    
    // Set properties
    if (data.name) rectangle.name = data.name;
    if (data.fills) rectangle.fills = data.fills;
    if (data.strokes) rectangle.strokes = data.strokes;
    if (data.cornerRadius !== undefined) rectangle.cornerRadius = data.cornerRadius;

    // Select and focus
    selectAndFocus([rectangle]);

    const result = {
      elementId: rectangle.id,
      message: `Created rectangle: "${rectangle.name}"`,
    };

    createSuccessResponse(id, result, "Rectangle created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_rectangle");
    throw error;
  }
}

/**
 * Create an ellipse shape
 */
export async function handleCreateEllipse(id: string, data: ElementCreationData): Promise<void> {
  try {
    console.log("[element-creation] Creating ellipse with data:", data);

    const ellipse = figma.createEllipse();
    
    // Set position and size
    ellipse.x = data.x || 0;
    ellipse.y = data.y || 0;
    ellipse.resize(data.width || 100, data.height || 100);
    
    // Set properties
    if (data.name) ellipse.name = data.name;
    if (data.fills) ellipse.fills = data.fills;
    if (data.strokes) ellipse.strokes = data.strokes;

    // Select and focus
    selectAndFocus([ellipse]);

    const result = {
      elementId: ellipse.id,
      message: `Created ellipse: "${ellipse.name}"`,
    };

    createSuccessResponse(id, result, "Ellipse created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_ellipse");
    throw error;
  }
}

/**
 * Create a text element
 */
export async function handleCreateText(id: string, data: TextCreationData): Promise<void> {
  try {
    console.log("[element-creation] Creating text with data:", data);

    const text = figma.createText();
    
    // Load font before setting text
    await loadFontWithFallback(data.fontFamily, data.fontWeight);

    // Set position
    text.x = data.x || 0;
    text.y = data.y || 0;
    
    // Set text content
    text.characters = data.text || "";
    
    // Set text properties
    if (data.fontSize) text.fontSize = data.fontSize;
    if (data.textAlign) text.textAlignHorizontal = data.textAlign;
    if (data.textColor) {
      text.fills = [{
        type: "SOLID",
        color: data.textColor,
      }];
    }
    
    // Set general properties
    if (data.name) text.name = data.name;
    if (data.width || data.height) {
      text.resize(data.width || 200, data.height || 50);
    }

    // Select and focus
    selectAndFocus([text]);

    const result = {
      elementId: text.id,
      message: `Created text: "${data.text}"`,
    };

    createSuccessResponse(id, result, "Text created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_text");
    throw error;
  }
}

/**
 * Create a connector between elements
 */
export async function handleCreateConnector(id: string, data: ConnectorData): Promise<void> {
  try {
    console.log("[element-creation] Creating connector with data:", data);

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
    if (data.strokeWeight) connector.strokeWeight = data.strokeWeight;
    if (data.strokeColor) {
      connector.strokes = [{
        type: "SOLID",
        color: data.strokeColor,
      }];
    }

    // Select and focus
    selectAndFocus([connector]);

    const result = {
      elementId: connector.id,
      message: `Created connector between elements`,
    };

    createSuccessResponse(id, result, "Connector created successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "create_connector");
    throw error;
  }
}