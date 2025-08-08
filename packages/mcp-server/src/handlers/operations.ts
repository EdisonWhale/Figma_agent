/**
 * Handlers for advanced operation tools
 */

import { ToolResponse } from '../types/index.js';
import {
  MoveElementSchema,
  ResizeElementSchema,
  RotateElementSchema,
  TidyUpSchema
} from '../schemas/index.js';

export const operationsHandlers = {
  move_element: (args: any): ToolResponse => {
    const parsed = MoveElementSchema.parse(args);
    return {
      action: 'move_element',
      data: parsed
    };
  },

  resize_element: (args: any): ToolResponse => {
    const parsed = ResizeElementSchema.parse(args);
    return {
      action: 'resize_element',
      data: parsed
    };
  },

  rotate_element: (args: any): ToolResponse => {
    const parsed = RotateElementSchema.parse(args);
    return {
      action: 'rotate_element',
      data: parsed
    };
  },

  tidy_up: (args: any): ToolResponse => {
    const parsed = TidyUpSchema.parse(args);
    return {
      action: 'tidy_up',
      data: parsed
    };
  }
};