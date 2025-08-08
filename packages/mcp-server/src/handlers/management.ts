/**
 * Handlers for element management tools
 */

import { ToolResponse } from '../types/index.js';
import {
  DeleteElementSchema,
  DeleteElementsSchema,
  UpdateElementSchema,
  SelectElementsSchema,
  DuplicateElementSchema,
  GetElementDetailsSchema,
  QueryElementsSchema
} from '../schemas/index.js';

export const managementHandlers = {
  get_current_page_info: (): ToolResponse => ({
    action: 'get_current_page_info',
    data: {}
  }),

  query_elements: (args: any): ToolResponse => {
    const parsed = QueryElementsSchema.parse(args);
    return {
      action: 'query_elements',
      data: parsed
    };
  },

  get_element_details: (args: any): ToolResponse => {
    const parsed = GetElementDetailsSchema.parse(args);
    return {
      action: 'get_element_details',
      data: parsed
    };
  },

  get_page_statistics: (): ToolResponse => ({
    action: 'get_page_statistics',
    data: {}
  }),

  get_document_info: (): ToolResponse => ({
    action: 'get_document_info',
    data: {}
  }),

  delete_element: (args: any): ToolResponse => {
    const parsed = DeleteElementSchema.parse(args);
    return {
      action: 'delete_element',
      data: parsed
    };
  },

  delete_elements: (args: any): ToolResponse => {
    const parsed = DeleteElementsSchema.parse(args);
    return {
      action: 'delete_elements',
      data: parsed
    };
  },

  update_element: (args: any): ToolResponse => {
    const parsed = UpdateElementSchema.parse(args);
    return {
      action: 'update_element',
      data: parsed
    };
  },

  select_elements: (args: any): ToolResponse => {
    const parsed = SelectElementsSchema.parse(args);
    return {
      action: 'select_elements',
      data: parsed
    };
  },

  duplicate_element: (args: any): ToolResponse => {
    const parsed = DuplicateElementSchema.parse(args);
    return {
      action: 'duplicate_element',
      data: {
        elementId: parsed.elementId,
        offsetX: parsed.offsetX || 20,
        offsetY: parsed.offsetY || 20,
      }
    };
  }
};