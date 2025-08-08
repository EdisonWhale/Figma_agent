/**
 * Handlers for layout and alignment tools
 */

import { ToolResponse } from '../types/index.js';
import {
  ArrangeElementsSchema,
  CreateStickyBatchSchema,
  AlignElementsSchema,
  GroupElementsSchema,
  UngroupElementsSchema
} from '../schemas/index.js';

export const layoutHandlers = {
  arrange_elements: (args: any): ToolResponse => {
    const parsed = ArrangeElementsSchema.parse(args);
    return {
      action: 'arrange_elements',
      data: {
        elementIds: parsed.elementIds,
        direction: parsed.direction,
        spacing: parsed.spacing || 10,
        padding: parsed.padding || 0,
        alignment: parsed.alignment || 'start',
        columns: parsed.columns,
      }
    };
  },

  create_sticky_batch: (args: any): ToolResponse => {
    const parsed = CreateStickyBatchSchema.parse(args);
    return {
      action: 'create_sticky_batch',
      data: {
        items: parsed.items,
        layout: parsed.layout || 'GRID',
        spacing: parsed.spacing || 20,
        startPosition: parsed.startPosition || { x: 100, y: 100 },
        defaultSize: parsed.defaultSize || { width: 240, height: 240 }
      }
    };
  },

  align_elements: (args: any): ToolResponse => {
    const parsed = AlignElementsSchema.parse(args);
    return {
      action: 'align_elements',
      data: {
        nodeIds: parsed.nodeIds,
        alignment: parsed.alignment,
        distributeSpacing: parsed.distributeSpacing
      }
    };
  },

  group_elements: (args: any): ToolResponse => {
    const parsed = GroupElementsSchema.parse(args);
    return {
      action: 'group_elements',
      data: {
        nodeIds: parsed.nodeIds,
        groupName: parsed.groupName || 'Group'
      }
    };
  },

  ungroup_elements: (args: any): ToolResponse => {
    const parsed = UngroupElementsSchema.parse(args);
    return {
      action: 'ungroup_elements',
      data: {
        groupId: parsed.groupId
      }
    };
  }
};