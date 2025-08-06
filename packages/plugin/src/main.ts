import { on, showUI, emit } from "@create-figma-plugin/utilities";
import { CloseHandler } from "./types";
import { UI_CONFIG } from "./constants";

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
 */
async function handleFigmaAPICall(msg: any): Promise<void> {
  const { id, action, data } = msg;

  console.log(`[main.ts] Handling Figma API call: ${action}`, data);

  try {
    switch (action) {
      case "create_sticky_note":
        await handleCreateStickyNote(id, data);
        break;

      case "get_document_info":
        await handleGetDocumentInfo(id);
        break;

      default:
        throw new Error(`Unknown Figma API action: ${action}`);
    }
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

/**
 * Create a sticky note in FigJam
 */
async function handleCreateStickyNote(id: string, data: any): Promise<void> {
  // Validate that we're in FigJam
  if (figma.editorType !== "figjam") {
    throw new Error("Sticky notes can only be created in FigJam");
  }

  console.log("[main.ts] Creating sticky note with data:", data);

  // Create the sticky note
  const sticky = figma.createSticky();

  // Set position
  sticky.x = data.x || 100;
  sticky.y = data.y || 100;

  // Load font before setting text (try multiple font styles)
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  } catch (error) {
    console.log("[main.ts] Inter Medium not available, trying Regular");
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch (error2) {
      console.log("[main.ts] Inter Regular not available, using default");
      // Use Figma's default font as fallback
      await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    }
  }

  // Set wide width if requested (StickyNode doesn't support custom resize)
  if (data.width && data.width > 300) {
    sticky.isWideWidth = true;
  }

  // Set text content
  sticky.text.characters = data.text || "";

  // Set color if provided
  if (data.color) {
    const colorMap: Record<string, RGB> = {
      yellow: { r: 1, g: 0.9, b: 0.2 },
      blue: { r: 0.2, g: 0.6, b: 1 },
      green: { r: 0.2, g: 0.8, b: 0.4 },
      pink: { r: 1, g: 0.4, b: 0.7 },
      purple: { r: 0.7, g: 0.4, b: 1 },
    };

    const color = colorMap[data.color.toLowerCase()];
    if (color) {
      sticky.fills = [
        {
          type: "SOLID",
          color: color,
        },
      ];
    }
  }

  // Select the created sticky
  figma.currentPage.selection = [sticky];

  // Zoom to fit the sticky
  figma.viewport.scrollAndZoomIntoView([sticky]);

  // Send success response
  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: {
      stickyId: sticky.id,
      message: `Created sticky note: "${data.text}"`,
    },
  });

  console.log("[main.ts] Sticky note created successfully:", sticky.id);
}

/**
 * Get document information
 */
async function handleGetDocumentInfo(id: string): Promise<void> {
  const info = {
    documentName: figma.root.name,
    currentPageName: figma.currentPage.name,
    editorType: figma.editorType,
    selectionCount: figma.currentPage.selection.length,
    timestamp: Date.now(),
  };

  figma.ui.postMessage({
    type: "FIGMA_API_RESPONSE",
    id,
    success: true,
    result: info,
  });

  console.log("[main.ts] Document info retrieved:", info);
}
