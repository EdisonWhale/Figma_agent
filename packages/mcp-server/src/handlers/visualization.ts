/**
 * Handlers for advanced visualization tools
 */

import { ToolResponse } from '../types/index.js';
import {
  CreateChartSchema,
  CreateDiagramSchema,
  CreateVisualizationSchema
} from '../schemas/index.js';

export const visualizationHandlers = {
  create_chart: (args: any): ToolResponse => {
    const parsed = CreateChartSchema.parse(args);
    return {
      action: 'create_chart',
      data: {
        type: parsed.type,
        data: parsed.data,
        position: parsed.position || { x: 0, y: 0 },
        size: parsed.size || { width: 400, height: 300 },
        title: parsed.title,
        showLegend: parsed.showLegend !== false,
        showGrid: parsed.showGrid !== false,
        showAxes: parsed.showAxes !== false,
        colorScheme: parsed.colorScheme || 'MULTI',
        backgroundColor: parsed.backgroundColor || { r: 1, g: 1, b: 1 },
        textColor: parsed.textColor || { r: 0.2, g: 0.2, b: 0.2 },
        fontSize: parsed.fontSize || 12,
        fontFamily: parsed.fontFamily || 'Inter'
      }
    };
  },

  create_diagram: (args: any): ToolResponse => {
    const parsed = CreateDiagramSchema.parse(args);
    return {
      action: 'create_diagram',
      data: {
        type: parsed.type,
        nodes: parsed.nodes,
        connections: parsed.connections || [],
        position: parsed.position || { x: 0, y: 0 },
        size: parsed.size || { width: 600, height: 400 },
        title: parsed.title,
        layout: parsed.layout || 'AUTO',
        spacing: parsed.spacing || { x: 120, y: 80 },
        nodeStyle: parsed.nodeStyle || {},
        connectionStyle: parsed.connectionStyle || {}
      }
    };
  },

  create_visualization: (args: any): ToolResponse => {
    const parsed = CreateVisualizationSchema.parse(args);
    return {
      action: 'create_visualization',
      data: {
        type: parsed.type,
        elements: parsed.elements,
        position: parsed.position || { x: 0, y: 0 },
        size: parsed.size || { width: 800, height: 600 },
        title: parsed.title,
        layout: parsed.layout || 'GRID',
        theme: parsed.theme || 'LIGHT',
        responsive: parsed.responsive || false
      }
    };
  }
};