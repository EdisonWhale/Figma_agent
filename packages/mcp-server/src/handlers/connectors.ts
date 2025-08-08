/**
 * Handlers for connector management tools
 */

import { ToolResponse } from '../types/index.js';
import {
  UpdateConnectorSchema,
  DeleteConnectorSchema,
  QueryConnectorsSchema,
  OptimizeConnectorPathsSchema
} from '../schemas/index.js';

export const connectorHandlers = {
  update_connector: (args: any): ToolResponse => {
    const parsed = UpdateConnectorSchema.parse(args);
    return {
      action: 'update_connector',
      data: parsed
    };
  },

  delete_connector: (args: any): ToolResponse => {
    const parsed = DeleteConnectorSchema.parse(args);
    return {
      action: 'delete_connector',
      data: parsed
    };
  },

  query_connectors: (args: any): ToolResponse => {
    const parsed = QueryConnectorsSchema.parse(args);
    return {
      action: 'query_connectors',
      data: parsed
    };
  },

  optimize_connector_paths: (args: any): ToolResponse => {
    const parsed = OptimizeConnectorPathsSchema.parse(args);
    return {
      action: 'optimize_connector_paths',
      data: {
        connectorIds: parsed.connectorIds,
        strategy: parsed.strategy || 'AVOID_OVERLAPS',
        margin: parsed.margin || 10,
        cornerRadius: parsed.cornerRadius || 8
      }
    };
  }
};