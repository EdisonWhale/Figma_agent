import { on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler } from "./types/index";
import { UI_CONFIG } from "./constants";

// Import all handlers
import {
  handleGetCurrentPageInfo,
  handleQueryElements,
  handleGetElementDetails,
  handleGetPageStatistics,
  handleGetDocumentInfo
} from "./handlers/page-info";

import {
  handleCreateStickyNote,
  handleCreateRectangle,
  handleCreateEllipse,
  handleCreateText,
  handleCreateConnector
} from "./handlers/element-creation";

import {
  handleDeleteElement,
  handleDeleteElements,
  handleUpdateElement,
  handleSelectElements,
  handleDuplicateElement,
  handleArrangeElements
} from "./handlers/element-management";

import {
  handleCreateStickyBatch
} from "./handlers/batch-operations";

import {
  handleAlignElements
} from "./handlers/layout-alignment";

import {
  handleGroupElements,
  handleUngroupElements
} from "./handlers/grouping";

import {
  handleCreateFlowchart,
  handleCreateMindMap,
  handleCreateShapeWithText,
  handleCreateCodeBlock,
  handleCreatePolygon,
  handleCreateStar,
  handleCreateFrame,
  handleCreateSection
} from "./handlers/advanced-creation";

import {
  handleMoveElement,
  handleResizeElement,
  handleRotateElement,
  handleTidyUp
} from "./handlers/advanced-operations";

import {
  handleUpdateConnector,
  handleDeleteConnector,
  handleQueryConnectors,
  handleOptimizeConnectorPaths
} from "./handlers/connector-management";

import {
  handleCreateChart,
  handleCreateDiagram,
  handleCreateVisualization
} from "./handlers/advanced-visualization";

export default function () {
  console.log("[main.ts] Plugin Main Thread Started");

  const uiOptions = {
    width: UI_CONFIG.WINDOW_WIDTH,
    height: UI_CONFIG.WINDOW_HEIGHT,
  };
  showUI(uiOptions);
  console.log("[main.ts] UI Shown", uiOptions);

  // Handle Plugin Close Request
  on<CloseHandler>("CLOSE", () => {
    console.log("[main.ts] Plugin Close Requested");
    figma.closePlugin();
  });

  // Handle Figma API calls from backend
  figma.ui.onmessage = async (msg) => {
    console.log("[main.ts] Received message from UI:", msg);

    try {
      if (msg.type === "FIGMA_API_CALL") {
        await handleFigmaAPICall(msg);
      }
    } catch (error) {
      console.error("[main.ts] Error handling message:", error);
      figma.ui.postMessage({
        type: "FIGMA_API_RESPONSE",
        id: msg.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  console.log("[main.ts] Event listeners ready.");
}

/**
 * Handle Figma API calls from backend
 * Dispatches to appropriate handler modules
 */
async function handleFigmaAPICall(msg: any): Promise<void> {
  const { id, action, data } = msg;

  console.log(`[main.ts] Handling Figma API call: ${action}`, data);

  try {
    // Define handler mapping for clean dispatch
    const handlers: Record<string, (id: string, data?: any) => Promise<void>> = {
      // Page information handlers
      "get_current_page_info": handleGetCurrentPageInfo,
      "query_elements": handleQueryElements,
      "get_element_details": handleGetElementDetails,
      "get_page_statistics": handleGetPageStatistics,
      "get_document_info": handleGetDocumentInfo,

      // Element creation handlers
      "create_sticky_note": handleCreateStickyNote,
      "create_rectangle": handleCreateRectangle,
      "create_ellipse": handleCreateEllipse,
      "create_text": handleCreateText,
      "create_connector": handleCreateConnector,

      // Element management handlers
      "delete_element": handleDeleteElement,
      "delete_elements": handleDeleteElements,
      "update_element": handleUpdateElement,
      "select_elements": handleSelectElements,
      "duplicate_element": handleDuplicateElement,
      "arrange_elements": handleArrangeElements,

      // Batch operation handlers
      "create_sticky_batch": handleCreateStickyBatch,

      // Layout and alignment handlers
      "align_elements": handleAlignElements,

      // Grouping operation handlers
      "group_elements": handleGroupElements,
      "ungroup_elements": handleUngroupElements,

      // Advanced creation handlers
      "create_flowchart": handleCreateFlowchart,
      "create_mindmap": handleCreateMindMap,
      "create_shape_with_text": handleCreateShapeWithText,
      "create_code_block": handleCreateCodeBlock,
      "create_polygon": handleCreatePolygon,
      "create_star": handleCreateStar,
      "create_frame": handleCreateFrame,
      "create_section": handleCreateSection,

      // Category 2: Advanced operations handlers
      "move_element": handleMoveElement,
      "resize_element": handleResizeElement,
      "rotate_element": handleRotateElement,

      // Category 4: Smart organization handlers
      "tidy_up": handleTidyUp,

      // Category 3: Connector management handlers
      "update_connector": handleUpdateConnector,
      "delete_connector": handleDeleteConnector,
      "query_connectors": handleQueryConnectors,
      "optimize_connector_paths": handleOptimizeConnectorPaths,

      // Category 5: Advanced visualization handlers
      "create_chart": handleCreateChart,
      "create_diagram": handleCreateDiagram,
      "create_visualization": handleCreateVisualization,
    };

    // Dispatch to appropriate handler
    const handler = handlers[action];
    if (!handler) {
      throw new Error(`Unknown Figma API action: ${action}`);
    }

    await handler(id, data);

  } catch (error) {
    console.error(`[main.ts] Error in ${action}:`, error);
    figma.ui.postMessage({
      type: "FIGMA_API_RESPONSE",
      id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}