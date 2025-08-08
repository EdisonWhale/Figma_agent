/**
 * Handler exports for MCP server tools
 */

import { creationHandlers } from './creation.js';
import { managementHandlers } from './management.js';
import { layoutHandlers } from './layout.js';
import { advancedHandlers } from './advanced.js';
import { operationsHandlers } from './operations.js';
import { connectorHandlers } from './connectors.js';
import { visualizationHandlers } from './visualization.js';

// Combine all handlers into a single registry
export const toolHandlers = {
  ...creationHandlers,
  ...managementHandlers,
  ...layoutHandlers,
  ...advancedHandlers,
  ...operationsHandlers,
  ...connectorHandlers,
  ...visualizationHandlers
};

// Export individual handler groups for flexibility
export {
  creationHandlers,
  managementHandlers,
  layoutHandlers,
  advancedHandlers,
  operationsHandlers,
  connectorHandlers,
  visualizationHandlers
};