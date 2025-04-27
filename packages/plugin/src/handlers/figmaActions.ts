// packages/plugin/src/handlers/figmaActions.ts
// Restored: Contains only the specific action handlers like createStickyNote.
// Imports utilities from the utils directory.
import { FunctionCallArguments, ActionResultPayload } from "../types";
import {
  mapColorNameToPaint, // Import from utils
  mapPaintToColorName, // Import from utils
  calculateRelativePosition, // Import from utils
} from "../utils";

/**
 * Handles the 'createStickyNote' action.
 * @param args - Parsed arguments from the AI function call.
 * @returns Promise<ActionResultPayload> - Result object for the action.
 */
export async function handleCreateStickyNote(
  args: FunctionCallArguments
): Promise<ActionResultPayload> {
  console.log("[figmaActions] Handling createStickyNote with args:", args);
  if (figma.editorType !== "figjam") {
    const errorMsg = "Create sticky note action is only available in FigJam.";
    console.warn(`[figmaActions] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    // Validate and extract arguments
    const text = typeof args.text === "string" ? args.text : "New Sticky";
    const requestedColor =
      typeof args.color === "string" || args.color === null ? args.color : null;
    const x = typeof args.x === "number" ? args.x : null;
    const y = typeof args.y === "number" ? args.y : null;
    const relativeToNodeId =
      typeof args.relativeToNodeId === "string" ? args.relativeToNodeId : null;
    const positionRelation =
      typeof args.positionRelation === "string" ? args.positionRelation : null;

    console.log(
      `[figmaActions] Parsed args: text='${text}', color='${requestedColor}', x=${x}, y=${y}, relativeTo='${relativeToNodeId}', relation='${positionRelation}'`
    );

    // 1. Create node
    const sticky = figma.createSticky();
    console.log(`[figmaActions] Created sticky node: ${sticky.id}`);

    // 2. Set text (with robust font loading)
    let fontLoaded = false;
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      fontLoaded = true;
    } catch (fontError) {
      console.warn(
        "[figmaActions] Failed to load Inter Medium, trying Inter Regular:",
        fontError
      );
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        fontLoaded = true;
      } catch (fallbackError) {
        console.error(
          "[figmaActions] Failed to load fallback font Inter Regular:",
          fallbackError
        );
        figma.notify(
          "Could not load required font, text might not display correctly.",
          { error: true }
        );
      }
    }
    if (fontLoaded) {
      sticky.text.characters = text;
      console.log(`[figmaActions] Set sticky text: "${text}"`);
    } else {
      sticky.text.characters = text; // Attempt to set anyway
    }

    // 3. Set color (using utility)
    const paint = mapColorNameToPaint(requestedColor); // Use util
    sticky.fills = [paint];
    console.log(
      `[figmaActions] Set sticky color. Requested: '${requestedColor}', Applied RGB:`,
      paint.color
    );

    // 4. Set position (using utility)
    let finalX: number;
    let finalY: number;

    if (relativeToNodeId) {
      console.log(
        `[figmaActions] Calculating position relative to node: ${relativeToNodeId}`
      );
      const referenceNode = await figma.getNodeByIdAsync(relativeToNodeId);

      if (
        referenceNode &&
        "absoluteBoundingBox" in referenceNode &&
        referenceNode.absoluteBoundingBox
      ) {
        const pos = calculateRelativePosition(
          // Use util
          referenceNode.absoluteBoundingBox,
          positionRelation,
          sticky.width,
          sticky.height
        );
        finalX = pos.x;
        finalY = pos.y;
        console.log(
          `[figmaActions] Calculated relative position: x=${finalX.toFixed(
            0
          )}, y=${finalY.toFixed(0)}`
        );
      } else {
        console.warn(
          `[figmaActions] Relative node ${relativeToNodeId} not found or invalid. Placing at viewport center.`
        );
        const viewportCenter = figma.viewport.center;
        finalX = viewportCenter.x - sticky.width / 2;
        finalY = viewportCenter.y - sticky.height / 2;
      }
    } else if (x !== null && y !== null) {
      console.log(`[figmaActions] Using absolute position: x=${x}, y=${y}`);
      finalX = x;
      finalY = y;
    } else {
      console.log(
        "[figmaActions] No position specified. Placing at viewport center."
      );
      const viewportCenter = figma.viewport.center;
      finalX = viewportCenter.x - sticky.width / 2;
      finalY = viewportCenter.y - sticky.height / 2;
    }

    sticky.x = finalX;
    sticky.y = finalY;
    console.log(
      `[figmaActions] Set final sticky position: x=${sticky.x.toFixed(
        0
      )}, y=${sticky.y.toFixed(0)}`
    );

    // 5. Select and zoom
    figma.currentPage.selection = [sticky];
    figma.viewport.scrollAndZoomIntoView([sticky]);
    console.log(
      `[figmaActions] Selected and zoomed to new sticky: ${sticky.id}`
    );

    // 6. Return success
    const successMessage = `Created ${mapPaintToColorName(
      paint
    )} sticky note with text "${text.substring(0, 20)}${
      text.length > 20 ? "..." : ""
    }".`; // Use util
    console.log("[figmaActions] handleCreateStickyNote successful.");
    return { success: true, nodeId: sticky.id, data: successMessage };
  } catch (error) {
    console.error("[figmaActions] Error in handleCreateStickyNote:", error);
    return {
      success: false,
      error: `Error creating sticky note: ${
        error instanceof Error ? error.message : "Unknown internal error"
      }`,
    };
  }
}

/**
 * Analyzes components in the current FigJam canvas.
 * @param args - Parsed arguments from the AI function call.
 * @returns Promise<ActionResultPayload> - Result object with component analysis.
 */
export async function handleAnalyzeFigJamComponents(
  args: FunctionCallArguments
): Promise<ActionResultPayload> {
  console.log("[figmaActions] Handling analyzeFigJamComponents with args:", args);
  if (figma.editorType !== "figjam") {
    const errorMsg = "Analyze components action is only available in FigJam.";
    console.warn(`[figmaActions] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    // Extract and validate arguments with proper type assertions
    const scope = typeof args.scope === "string" ? args.scope as "selection" | "viewport" | "page" : "viewport";
    const includeText = args.includeText !== false; // default to true
    const includeAttributes = args.includeAttributes !== false; // default to true
    const includePositions = args.includePositions !== false; // default to true
    const includeConnections = args.includeConnections !== false; // default to true
    const maxDepth = typeof args.maxDepth === "number" ? args.maxDepth : -1; // default to unlimited
    
    console.log(`[figmaActions] Analyzing FigJam components with scope: ${scope}`);
    
    // Determine which nodes to analyze based on scope
    let nodesToAnalyze: readonly SceneNode[] = [];
    
    switch (scope) {
      case "selection":
        nodesToAnalyze = figma.currentPage.selection;
        if (nodesToAnalyze.length === 0) {
          return {
            success: true,
            data: {
              message: "No nodes are currently selected.",
              components: []
            }
          };
        }
        break;
        
      case "viewport":
        // Get nodes visible in the current viewport
        const viewportNodes = figma.currentPage.findAll(node => {
          if (!("absoluteBoundingBox" in node) || !node.absoluteBoundingBox) return false;
          
          const bounds = node.absoluteBoundingBox;
          const viewport = figma.viewport.bounds;
          
          // Check if node is at least partially visible in viewport
          return !(
            bounds.x > viewport.x + viewport.width ||
            bounds.y > viewport.y + viewport.height ||
            bounds.x + bounds.width < viewport.x ||
            bounds.y + bounds.height < viewport.y
          );
        });
        nodesToAnalyze = viewportNodes as readonly SceneNode[];
        break;
        
      case "page":
      default:
        nodesToAnalyze = figma.currentPage.children;
        break;
    }
    
    console.log(`[figmaActions] Found ${nodesToAnalyze.length} nodes to analyze`);
    
    // Analyze the nodes - create a mutable copy of the readonly array
    const componentData = await analyzeNodes(
      Array.from(nodesToAnalyze), 
      includeText, 
      includeAttributes, 
      includePositions, 
      includeConnections,
      maxDepth
    );
    
    return {
      success: true,
      data: {
        message: `Analyzed ${componentData.length} components on the FigJam canvas.`,
        scope: scope,
        components: componentData
      }
    };
  } catch (error) {
    console.error("[figmaActions] Error in handleAnalyzeFigJamComponents:", error);
    return {
      success: false,
      error: `Error analyzing FigJam components: ${
        error instanceof Error ? error.message : "Unknown internal error"
      }`,
    };
  }
}

/**
 * Recursively analyzes nodes and their properties.
 * @param nodes - Array of nodes to analyze
 * @param includeText - Whether to include text content
 * @param includeAttributes - Whether to include detailed attributes
 * @param includePositions - Whether to include position information
 * @param includeConnections - Whether to include connection relationships
 * @param maxDepth - Maximum depth to traverse (-1 for unlimited)
 * @param currentDepth - Current traversal depth (internal use)
 * @returns Array of analyzed component data
 */
async function analyzeNodes(
  nodes: SceneNode[],
  includeText: boolean = true,
  includeAttributes: boolean = true,
  includePositions: boolean = true,
  includeConnections: boolean = true,
  maxDepth: number = -1,
  currentDepth: number = 0
): Promise<any[]> {
  // If maximum depth reached and it's not unlimited (-1), stop recursion
  if (maxDepth !== -1 && currentDepth > maxDepth) {
    return [];
  }

  const results = [];
  const connectionMap = new Map<string, Set<string>>();

  // First pass: collect all nodes data and build connection map
  for (const node of nodes) {
    // Basic node information (always included)
    const nodeData: any = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // Positions and dimensions (if requested)
    if (includePositions) {
      nodeData.position = {
        x: node.x,
        y: node.y,
      };
      
      if ("width" in node && "height" in node) {
        nodeData.size = {
          width: node.width,
          height: node.height,
        };
      }
    }

    // Include detailed attributes if requested
    if (includeAttributes) {
      // Different properties based on node type
      if ("fills" in node && node.fills) {
        const fills = Array.isArray(node.fills) ? node.fills : [node.fills];
        nodeData.fills = fills.map(fill => {
          if (fill.type === "SOLID") {
            return {
              type: "SOLID",
              color: fill.color ? 
                {r: fill.color.r, g: fill.color.g, b: fill.color.b} : 
                undefined,
              opacity: fill.opacity,
              visible: fill.visible
            };
          }
          return { type: fill.type };
        });
      }
      
      // Add other properties based on node type
      switch (node.type) {
        case "STICKY":
          if ("authorVisible" in node) {
            nodeData.authorVisible = node.authorVisible;
          }
          break;
        case "SHAPE_WITH_TEXT":
          if ("shapeType" in node) {
            nodeData.shapeType = node.shapeType;
          }
          break;
        case "CONNECTOR":
          if ("connectorStart" in node && "connectorEnd" in node) {
            // Safely handle connector endpoints without making assumptions about the type
            nodeData.connector = {
              // Basic connector info that should be safe regardless of endpoint type
              strokeWeight: "strokeWeight" in node ? node.strokeWeight : undefined,
            };
            
            // Safely try to extract connection info for the connection map
            if (includeConnections) {
              try {
                // Try to access properties with type guards and safe typecasting
                const startNode = (node.connectorStart as any).endpointNodeId;
                const endNode = (node.connectorEnd as any).endpointNodeId;
                
                if (startNode && endNode) {
                  // Add connection info to the connector data
                  nodeData.connector.startNodeId = startNode;
                  nodeData.connector.endNodeId = endNode;
                  
                  // Update connection map
                  if (!connectionMap.has(startNode)) {
                    connectionMap.set(startNode, new Set<string>());
                  }
                  connectionMap.get(startNode)!.add(endNode);
                }
              } catch (e) {
                console.warn(`[figmaActions] Error extracting connector endpoints for node ${node.id}:`, e);
              }
            }
          }
          break;
      }
    }

    // Include text content if requested and the node has it
    if (includeText && "characters" in node && node.characters !== undefined) {
      // Try to fetch text content safely
      let textContent;
      try {
        textContent = node.characters;
      } catch (e) {
        textContent = "[Text content unavailable]";
        console.warn(`[figmaActions] Couldn't get text content for node ${node.id}:`, e);
      }
      nodeData.text = textContent;
    }

    // Recursively process children if the node is a parent
    if ("children" in node && node.children && node.children.length > 0) {
      nodeData.children = await analyzeNodes(
        Array.from(node.children), // Ensure we're working with a mutable copy
        includeText,
        includeAttributes,
        includePositions,
        includeConnections,
        maxDepth,
        currentDepth + 1
      );
    }

    results.push(nodeData);
  }

  // Second pass: add connection relationships if requested
  if (includeConnections && connectionMap.size > 0) {
    for (const nodeData of results) {
      if (connectionMap.has(nodeData.id)) {
        nodeData.connectedTo = Array.from(connectionMap.get(nodeData.id)!);
      }
    }
  }

  return results;
}

// Add other specific action handlers here as needed, e.g.:
// export async function handleDeleteNode(args: { nodeId: string }): Promise<ActionResultPayload> { ... }
