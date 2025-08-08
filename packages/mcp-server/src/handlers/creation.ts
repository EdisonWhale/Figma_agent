/**
 * Handlers for element creation tools
 */

import { ToolResponse } from '../types/index.js';
import {
  CreateStickyNoteSchema,
  CreateRectangleSchema,
  CreateEllipseSchema,
  CreateTextSchema,
  CreateConnectorSchema
} from '../schemas/index.js';

export const creationHandlers = {
  create_sticky_note: (args: any): ToolResponse => {
    const parsed = CreateStickyNoteSchema.parse(args);
    return {
      action: 'create_sticky_note',
      data: {
        text: parsed.text,
        x: parsed.x || 100,
        y: parsed.y || 100,
        color: parsed.color || 'yellow',
        fills: parsed.fills,
        width: parsed.width || 240,
        height: parsed.height || 240,
        authorVisible: parsed.authorVisible !== false,
        isWideWidth: parsed.isWideWidth || false,
      }
    };
  },

  create_rectangle: (args: any): ToolResponse => {
    const parsed = CreateRectangleSchema.parse(args);
    return {
      action: 'create_rectangle',
      data: {
        x: parsed.x || 0,
        y: parsed.y || 0,
        width: parsed.width || 100,
        height: parsed.height || 100,
        fills: parsed.fills || [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }],
        strokes: parsed.strokes,
        cornerRadius: parsed.cornerRadius,
        name: parsed.name || 'Rectangle',
      }
    };
  },

  create_ellipse: (args: any): ToolResponse => {
    const parsed = CreateEllipseSchema.parse(args);
    return {
      action: 'create_ellipse',
      data: {
        x: parsed.x || 0,
        y: parsed.y || 0,
        width: parsed.width || 100,
        height: parsed.height || 100,
        fills: parsed.fills || [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }],
        strokes: parsed.strokes,
        name: parsed.name || 'Ellipse',
      }
    };
  },

  create_text: (args: any): ToolResponse => {
    const parsed = CreateTextSchema.parse(args);
    return {
      action: 'create_text',
      data: {
        text: parsed.text,
        x: parsed.x || 0,
        y: parsed.y || 0,
        width: parsed.width || 200,
        height: parsed.height || 50,
        fontSize: parsed.fontSize || 16,
        fontFamily: parsed.fontFamily || 'Inter',
        fontWeight: parsed.fontWeight || 'Regular',
        textAlign: parsed.textAlign || 'LEFT',
        textColor: parsed.textColor || { r: 0, g: 0, b: 0 },
        name: parsed.name || 'Text',
      }
    };
  },

  create_connector: (args: any): ToolResponse => {
    const parsed = CreateConnectorSchema.parse(args);
    return {
      action: 'create_connector',
      data: {
        startElementId: parsed.startElementId,
        endElementId: parsed.endElementId,
        startPosition: parsed.startPosition,
        endPosition: parsed.endPosition,
        strokeWeight: parsed.strokeWeight || 2,
        strokeColor: parsed.strokeColor || { r: 0, g: 0, b: 0 },
      }
    };
  }
};