/**
 * Shape Creation Utilities
 * Provides utilities for creating various shapes with text integration
 */

import { loadFontWithFallback } from './batch';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ShapeWithTextOptions {
  text: string;
  position?: Position;
  size?: Size;
  shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'star';
  backgroundColor?: { r: number; g: number; b: number };
  textColor?: { r: number; g: number; b: number };
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT';
  cornerRadius?: number; // For rectangles
  pointCount?: number; // For polygons and stars
  innerRadius?: number; // For stars (ratio of inner to outer radius, 0-1)
}

export interface CodeBlockOptions {
  code: string;
  language?: string;
  position?: Position;
  size?: Size;
  backgroundColor?: { r: number; g: number; b: number };
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
}

export interface PolygonOptions {
  position?: Position;
  size?: Size;
  pointCount: number;
  fills?: Array<{ type: string; color: { r: number; g: number; b: number } }>;
  rotation?: number;
}

export interface StarOptions {
  position?: Position;
  size?: Size;
  pointCount: number;
  innerRadius: number; // Ratio of inner to outer radius (0-1)
  fills?: Array<{ type: string; color: { r: number; g: number; b: number } }>;
  rotation?: number;
}

/**
 * Create a shape with integrated text
 */
export async function createShapeWithText(options: ShapeWithTextOptions): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    text,
    position = { x: 0, y: 0 },
    size = { width: 150, height: 100 },
    shapeType,
    backgroundColor = { r: 0.9, g: 0.9, b: 0.9 },
    textColor = { r: 0, g: 0, b: 0 },
    fontSize = 14,
    fontFamily = 'Inter',
    fontWeight = 'Regular',
    textAlign = 'CENTER',
    cornerRadius = 8,
    pointCount = 5,
    innerRadius = 0.4
  } = options;

  // Load font first
  await loadFontWithFallback();

  let shape: SceneNode;

  // Create shape based on type
  switch (shapeType) {
    case 'rectangle':
      shape = figma.createRectangle();
      (shape as RectangleNode).cornerRadius = cornerRadius;
      break;
    
    case 'ellipse':
      shape = figma.createEllipse();
      break;
    
    case 'polygon':
      shape = figma.createPolygon();
      (shape as PolygonNode).pointCount = pointCount;
      break;
    
    case 'star':
      shape = figma.createStar();
      (shape as StarNode).pointCount = pointCount;
      (shape as StarNode).innerRadius = innerRadius;
      break;
    
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }

  // Set position and size
  shape.x = position.x;
  shape.y = position.y;
  shape.resize(size.width, size.height);

  // Set background color
  if ('fills' in shape) {
    (shape as any).fills = [{
      type: "SOLID",
      color: backgroundColor
    }];
  }

  // Create text node
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.fontSize = fontSize;
  
  try {
    textNode.fontName = { family: fontFamily, style: fontWeight };
  } catch (error) {
    console.warn(`Font ${fontFamily} ${fontWeight} not available, using default`);
    textNode.fontName = { family: 'Inter', style: 'Regular' };
  }

  textNode.textAlignHorizontal = textAlign;
  textNode.textAlignVertical = 'CENTER';
  
  // Set text color
  if ('fills' in textNode) {
    (textNode as any).fills = [{
      type: "SOLID",
      color: textColor
    }];
  }

  // Position text in center of shape
  textNode.x = position.x + (size.width - textNode.width) / 2;
  textNode.y = position.y + (size.height - textNode.height) / 2;

  // Group shape and text
  const group = figma.group([shape, textNode], figma.currentPage);
  group.name = `${shapeType} with text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`;

  return { elementId: group.id, type: `${shapeType}_with_text` };
}

/**
 * Create a code block with syntax highlighting styling
 */
export async function createCodeBlock(options: CodeBlockOptions): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    code,
    language = 'javascript',
    position = { x: 0, y: 0 },
    size = { width: 400, height: 300 },
    backgroundColor = { r: 0.1, g: 0.1, b: 0.1 }, // Dark background by default
    theme = 'dark',
    showLineNumbers = true
  } = options;

  // Load font first
  await loadFontWithFallback();

  // Create background rectangle
  const background = figma.createRectangle();
  background.x = position.x;
  background.y = position.y;
  background.resize(size.width, size.height);
  background.cornerRadius = 8;
  
  // Set background color based on theme
  const bgColor = theme === 'dark' 
    ? backgroundColor 
    : { r: 0.98, g: 0.98, b: 0.98 };
    
  if ('fills' in background) {
    (background as any).fills = [{
      type: "SOLID",
      color: bgColor
    }];
  }

  // Create header with language label
  const header = figma.createRectangle();
  header.x = position.x;
  header.y = position.y;
  header.resize(size.width, 32);
  header.cornerRadius = 8;
  
  if ('fills' in header) {
    (header as any).fills = [{
      type: "SOLID",
      color: theme === 'dark' 
        ? { r: 0.15, g: 0.15, b: 0.15 }
        : { r: 0.92, g: 0.92, b: 0.92 }
    }];
  }

  // Create language label
  const languageLabel = figma.createText();
  languageLabel.characters = language.toUpperCase();
  languageLabel.fontSize = 10;
  languageLabel.fontName = { family: 'Inter', style: 'Medium' };
  
  if ('fills' in languageLabel) {
    (languageLabel as any).fills = [{
      type: "SOLID",
      color: theme === 'dark' 
        ? { r: 0.7, g: 0.7, b: 0.7 }
        : { r: 0.5, g: 0.5, b: 0.5 }
    }];
  }
  
  languageLabel.x = position.x + 12;
  languageLabel.y = position.y + 11;

  // Create code text
  const codeText = figma.createText();
  
  // Add line numbers if requested
  let displayCode = code;
  if (showLineNumbers) {
    const lines = code.split('\n');
    displayCode = lines.map((line, index) => 
      `${String(index + 1).padStart(2, ' ')}  ${line}`
    ).join('\n');
  }
  
  codeText.characters = displayCode;
  codeText.fontSize = 12;
  
  try {
    codeText.fontName = { family: 'JetBrains Mono', style: 'Regular' };
  } catch (error) {
    try {
      codeText.fontName = { family: 'Consolas', style: 'Regular' };
    } catch (error) {
      codeText.fontName = { family: 'Inter', style: 'Regular' };
    }
  }
  
  // Set text color based on theme
  const textColor = theme === 'dark' 
    ? { r: 0.9, g: 0.9, b: 0.9 }
    : { r: 0.1, g: 0.1, b: 0.1 };
    
  if ('fills' in codeText) {
    (codeText as any).fills = [{
      type: "SOLID",
      color: textColor
    }];
  }
  
  codeText.x = position.x + 12;
  codeText.y = position.y + 44;
  
  // Resize text to fit in the code area
  const maxWidth = size.width - 24;
  const maxHeight = size.height - 56;
  
  if (codeText.width > maxWidth) {
    codeText.resize(maxWidth, codeText.height);
  }
  
  if (codeText.height > maxHeight) {
    codeText.resize(codeText.width, maxHeight);
  }

  // Group all elements
  const group = figma.group([background, header, languageLabel, codeText], figma.currentPage);
  group.name = `Code Block (${language}): ${code.substring(0, 30).replace(/\n/g, ' ')}${code.length > 30 ? '...' : ''}`;

  return { elementId: group.id, type: 'code_block' };
}

/**
 * Create a polygon shape
 */
export async function createPolygon(options: PolygonOptions): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    position = { x: 0, y: 0 },
    size = { width: 100, height: 100 },
    pointCount,
    fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }],
    rotation = 0
  } = options;

  // Create polygon
  const polygon = figma.createPolygon();
  polygon.pointCount = Math.max(3, Math.min(pointCount, 20)); // Limit between 3-20 points
  
  // Set position and size
  polygon.x = position.x;
  polygon.y = position.y;
  polygon.resize(size.width, size.height);
  
  // Set rotation if provided
  if (rotation !== 0) {
    polygon.rotation = rotation;
  }

  // Set fills
  if ('fills' in polygon) {
    (polygon as any).fills = fills;
  }

  polygon.name = `Polygon (${pointCount} points)`;

  return { elementId: polygon.id, type: 'polygon' };
}

/**
 * Create a star shape
 */
export async function createStar(options: StarOptions): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    position = { x: 0, y: 0 },
    size = { width: 100, height: 100 },
    pointCount,
    innerRadius,
    fills = [{ type: 'SOLID', color: { r: 1, g: 0.8, b: 0 } }], // Gold color by default
    rotation = 0
  } = options;

  // Create star
  const star = figma.createStar();
  star.pointCount = Math.max(3, Math.min(pointCount, 20)); // Limit between 3-20 points
  star.innerRadius = Math.max(0.1, Math.min(innerRadius, 0.9)); // Limit between 0.1-0.9
  
  // Set position and size
  star.x = position.x;
  star.y = position.y;
  star.resize(size.width, size.height);
  
  // Set rotation if provided
  if (rotation !== 0) {
    star.rotation = rotation;
  }

  // Set fills
  if ('fills' in star) {
    (star as any).fills = fills;
  }

  star.name = `Star (${pointCount} points, ${Math.round(innerRadius * 100)}% inner radius)`;

  return { elementId: star.id, type: 'star' };
}

/**
 * Create a frame container
 */
export async function createFrame(options: {
  position?: Position;
  size?: Size;
  name?: string;
  backgroundColor?: { r: number; g: number; b: number };
  cornerRadius?: number;
  clipContent?: boolean;
}): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    position = { x: 0, y: 0 },
    size = { width: 200, height: 200 },
    name = 'Frame',
    backgroundColor = { r: 1, g: 1, b: 1 },
    cornerRadius = 0,
    clipContent = false
  } = options;

  // Create frame
  const frame = figma.createFrame();
  
  // Set position and size
  frame.x = position.x;
  frame.y = position.y;
  frame.resize(size.width, size.height);
  
  // Set properties
  frame.name = name;
  frame.clipsContent = clipContent;
  
  if (cornerRadius > 0) {
    frame.cornerRadius = cornerRadius;
  }

  // Set background color
  if ('fills' in frame) {
    (frame as any).fills = [{
      type: "SOLID",
      color: backgroundColor
    }];
  }

  return { elementId: frame.id, type: 'frame' };
}

/**
 * Create a section (available in FigJam)
 */
export async function createSection(options: {
  position?: Position;
  size?: Size;
  title?: string;
  backgroundColor?: { r: number; g: number; b: number };
}): Promise<{ elementId: string; type: string }> {
  if (typeof figma === 'undefined') {
    throw new Error("Figma API is not available");
  }

  const {
    position = { x: 0, y: 0 },
    size = { width: 300, height: 200 },
    title = 'Section',
    backgroundColor = { r: 0.95, g: 0.95, b: 1 }
  } = options;

  if (figma.editorType === "figjam") {
    // In FigJam, use native section
    const section = figma.createSection();
    
    section.x = position.x;
    section.y = position.y;
    // Note: SectionNode doesn't have resize method in FigJam API
    // Use width/height directly if available
    try {
      (section as any).resize(size.width, size.height);
    } catch (error) {
      // Fallback if resize is not available
      console.warn("Cannot resize section, setting bounds manually");
    }
    section.name = title;
    
    // Set section fill if available
    if ('fills' in section) {
      try {
        (section as any).fills = [{
          type: "SOLID",
          color: backgroundColor
        }];
      } catch (error) {
        console.warn("Could not set section background color:", error);
      }
    }
    
    return { elementId: section.id, type: 'section' };
  } else {
    // In regular Figma, create a frame as section equivalent
    const frame = figma.createFrame();
    
    frame.x = position.x;
    frame.y = position.y;
    frame.resize(size.width, size.height);
    frame.name = `Section: ${title}`;
    frame.cornerRadius = 8;
    
    // Set background
    if ('fills' in frame) {
      (frame as any).fills = [{
        type: "SOLID",
        color: backgroundColor
      }];
    }
    
    // Add title text
    await loadFontWithFallback();
    const titleText = figma.createText();
    titleText.characters = title;
    titleText.fontSize = 16;
    titleText.fontName = { family: 'Inter', style: 'Medium' };
    titleText.x = position.x + 16;
    titleText.y = position.y + 16;
    
    if ('fills' in titleText) {
      (titleText as any).fills = [{
        type: "SOLID",
        color: { r: 0.2, g: 0.2, b: 0.2 }
      }];
    }
    
    // Group frame and title
    const group = figma.group([frame, titleText], figma.currentPage);
    group.name = `Section: ${title}`;
    
    return { elementId: group.id, type: 'section' };
  }
}