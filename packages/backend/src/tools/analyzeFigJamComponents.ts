/**
 * Tool Definition: Analyze FigJam Components
 */
import { Tool } from "../types";

export const analyzeFigJamComponentsTool: Tool = {
  type: "function",
  name: "analyzeFigJamComponents",
  description:
    "Scans the current FigJam canvas and returns information about all components present, including their types, positions, contents, and relationships. Useful for understanding the current state of the canvas.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        description: "Scope of the analysis: 'selection' for selected nodes only, 'viewport' for visible area, 'page' for entire page.",
        enum: ["selection", "viewport", "page"],
      },
      includeText: {
        type: "boolean",
        description: "Whether to include text content from components. Set to true to analyze text within nodes.",
      },
      includeAttributes: {
        type: "boolean",
        description: "Whether to include detailed attributes like colors, sizes, etc.",
      },
      includePositions: {
        type: "boolean", 
        description: "Whether to include position information (x, y coordinates).",
      },
      includeConnections: {
        type: "boolean",
        description: "Whether to analyze and include connection relationships between components.",
      },
      maxDepth: {
        type: "integer",
        description: "Maximum depth to traverse when analyzing nested components. Set to -1 for unlimited depth.",
      }
    },
    required: ["scope", "includeText", "includeAttributes", "includePositions", "includeConnections", "maxDepth"],
    additionalProperties: false,
  },
}; 