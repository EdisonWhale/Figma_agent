/**
 * Tool definitions and registry for MCP server
 */

export const toolDefinitions = [
  // Page and element information tools
  {
    name: "get_current_page_info",
    description: "Get information about the current page including all elements",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_document_info", 
    description: "Get document information including name, current page, and basic metadata",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    }
  },
  {
    name: "query_elements",
    description: "Query elements by type, name, region, or properties",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: { type: "string" },
          description: "Filter by element types",
        },
        names: {
          type: "array",
          items: { type: "string" },
          description: "Filter by element names",
        },
        namePattern: {
          type: "string",
          description: "Filter by name pattern (regex)",
        },
        region: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
          },
          description: "Filter by region",
        },
        properties: {
          type: "object",
          description: "Filter by properties",
        },
      },
    },
  },
  {
    name: "get_element_details",
    description: "Get detailed information about a specific element",
    inputSchema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "ID of element to get details for",
        },
      },
      required: ["elementId"],
    },
  },
  {
    name: "get_page_statistics",
    description: "Get statistical information about the current page",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  // Element creation tools
  {
    name: "create_sticky_note",
    description: "Create a sticky note in FigJam with specified text and optional positioning/styling",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text content for the sticky note",
        },
        x: {
          type: "number",
          description: "X position (default: 100)",
        },
        y: {
          type: "number",
          description: "Y position (default: 100)",
        },
        color: {
          type: "string",
          description: "Sticky note color (yellow, blue, green, pink, purple, red, orange, dark_blue, dark_green)",
          enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green"],
        },
        width: {
          type: "number",
          description: "Width of the sticky note (default: 240)",
        },
        height: {
          type: "number",
          description: "Height of the sticky note (default: 240)",
        },
        authorVisible: {
          type: "boolean",
          description: "Whether to show author name (default: true)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "create_rectangle",
    description: "Create a rectangle shape with customizable properties",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X position (default: 0)" },
        y: { type: "number", description: "Y position (default: 0)" },
        width: { type: "number", description: "Width (default: 100)" },
        height: { type: "number", description: "Height (default: 100)" },
        fills: { type: "array", description: "Fill colors" },
        strokes: { type: "array", description: "Stroke colors" },
        cornerRadius: { type: "number", description: "Corner radius" },
        name: { type: "string", description: "Element name" },
      },
    },
  },
  {
    name: "create_ellipse",
    description: "Create an ellipse shape with customizable properties",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X position (default: 0)" },
        y: { type: "number", description: "Y position (default: 0)" },
        width: { type: "number", description: "Width (default: 100)" },
        height: { type: "number", description: "Height (default: 100)" },
        fills: { type: "array", description: "Fill colors" },
        strokes: { type: "array", description: "Stroke colors" },
        name: { type: "string", description: "Element name" },
      },
    },
  },
  {
    name: "create_text",
    description: "Create a text element with customizable styling",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content" },
        x: { type: "number", description: "X position (default: 0)" },
        y: { type: "number", description: "Y position (default: 0)" },
        width: { type: "number", description: "Width (default: 200)" },
        height: { type: "number", description: "Height (default: 50)" },
        fontSize: { type: "number", description: "Font size (default: 16)" },
        fontFamily: { type: "string", description: "Font family (default: Inter)" },
        fontWeight: { type: "string", description: "Font weight (default: Regular)" },
        textAlign: { 
          type: "string", 
          enum: ["LEFT", "CENTER", "RIGHT"],
          description: "Text alignment" 
        },
        textColor: {
          type: "object",
          properties: {
            r: { type: "number" },
            g: { type: "number" },
            b: { type: "number" },
          },
          description: "Text color RGB",
        },
        name: { type: "string", description: "Element name" },
      },
      required: ["text"],
    },
  },
  {
    name: "create_connector",
    description: "Create a connector line between two elements",
    inputSchema: {
      type: "object",
      properties: {
        startElementId: { type: "string", description: "ID of the starting element" },
        endElementId: { type: "string", description: "ID of the ending element" },
        startPosition: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Start position override",
        },
        endPosition: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "End position override",
        },
        strokeWeight: { type: "number", description: "Stroke weight" },
        strokeColor: {
          type: "object",
          properties: {
            r: { type: "number" },
            g: { type: "number" },
            b: { type: "number" },
          },
          description: "Stroke color RGB",
        },
      },
      required: ["startElementId", "endElementId"],
    },
  },

  // Element management tools
  {
    name: "delete_element",
    description: "Delete a single element by ID",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of element to delete" },
      },
      required: ["elementId"],
    },
  },
  {
    name: "delete_elements",
    description: "Delete multiple elements by their IDs",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of element IDs to delete",
        },
      },
      required: ["elementIds"],
    },
  },
  {
    name: "update_element",
    description: "Update properties of an existing element",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of element to update" },
        properties: { type: "object", description: "Properties to update" },
      },
      required: ["elementId", "properties"],
    },
  },
  {
    name: "select_elements",
    description: "Select one or more elements",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of element IDs to select",
        },
      },
      required: ["elementIds"],
    },
  },
  {
    name: "duplicate_element",
    description: "Duplicate an element with optional offset",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of element to duplicate" },
        offsetX: { type: "number", description: "X offset for duplicate (default: 20)" },
        offsetY: { type: "number", description: "Y offset for duplicate (default: 20)" },
      },
      required: ["elementId"],
    },
  },

  // Layout and organization tools
  {
    name: "arrange_elements",
    description: "Arrange multiple elements in a layout pattern",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of element IDs to arrange",
        },
        direction: {
          type: "string",
          enum: ["horizontal", "vertical", "grid"],
          description: "Layout direction",
        },
        spacing: { type: "number", description: "Spacing between elements" },
        padding: { type: "number", description: "Padding around layout" },
        alignment: {
          type: "string",
          enum: ["start", "center", "end", "stretch"],
          description: "Element alignment",
        },
        columns: { type: "number", description: "Number of columns (for grid layout)" },
      },
      required: ["elementIds", "direction"],
    },
  },

  // Batch creation tools
  {
    name: "create_sticky_batch",
    description: "Create multiple sticky notes in a batch with automatic layout",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text content for the sticky note" },
              color: { 
                type: "string", 
                enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green", "lightRed", "lightBlue", "lightGreen", "gray", "lightGray"],
                description: "Sticky note color from FigJam color palette" 
              },
              position: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                },
                description: "Custom position for this sticky note"
              }
            },
            required: ["text"]
          },
          description: "Array of sticky note configurations"
        },
        layout: {
          type: "string",
          enum: ["GRID", "ROW", "COLUMN"],
          description: "Layout pattern for positioning (default: GRID)"
        },
        spacing: { type: "number", description: "Spacing between sticky notes (default: 20)" },
        startPosition: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" }
          },
          description: "Starting position for layout (default: {x: 100, y: 100})"
        },
        defaultSize: {
          type: "object",
          properties: {
            width: { type: "number" },
            height: { type: "number" }
          },
          description: "Default size for sticky notes (default: {width: 240, height: 240})"
        }
      },
      required: ["items"]
    }
  },

  // Layout and alignment tools  
  {
    name: "align_elements",
    description: "Align multiple elements by specified alignment type",
    inputSchema: {
      type: "object",
      properties: {
        nodeIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of element IDs to align"
        },
        alignment: {
          type: "string",
          enum: ["LEFT", "CENTER", "RIGHT", "TOP", "MIDDLE", "BOTTOM"],
          description: "Alignment type"
        },
        distributeSpacing: {
          type: "number",
          description: "Spacing for distribution (if not provided, elements are aligned without distribution)"
        }
      },
      required: ["nodeIds", "alignment"]
    }
  },

  // Grouping tools
  {
    name: "group_elements",
    description: "Group multiple elements together",
    inputSchema: {
      type: "object",
      properties: {
        nodeIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of element IDs to group"
        },
        groupName: {
          type: "string",
          description: "Name for the group (default: 'Group')"
        }
      },
      required: ["nodeIds"]
    }
  },
  {
    name: "ungroup_elements",
    description: "Ungroup a group of elements",
    inputSchema: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "ID of the group to ungroup"
        }
      },
      required: ["groupId"]
    }
  },

  // Advanced creation tools
  {
    name: "create_flowchart",
    description: "Create a flowchart diagram with automatic layout and connections",
    inputSchema: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique identifier for the node" },
              text: { type: "string", description: "Text content of the node" },
              type: { 
                type: "string", 
                enum: ["start", "process", "decision", "end", "data"],
                description: "Type of flowchart node" 
              },
              position: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                },
                description: "Custom position for this node"
              }
            },
            required: ["id", "text", "type"]
          },
          description: "Array of flowchart nodes"
        },
        connections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "ID of the source node" },
              to: { type: "string", description: "ID of the target node" },
              label: { type: "string", description: "Optional label for the connection" }
            },
            required: ["from", "to"]
          },
          description: "Array of connections between nodes"
        },
        layout: {
          type: "string",
          enum: ["TOP_TO_BOTTOM", "LEFT_TO_RIGHT", "AUTO"],
          description: "Layout direction for the flowchart (default: AUTO)"
        },
        spacing: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" }
          },
          description: "Spacing between nodes (default: {x: 60, y: 60})"
        },
        startPosition: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" }
          },
          description: "Starting position for the flowchart (default: {x: 200, y: 200})"
        }
      },
      required: ["nodes", "connections"]
    }
  },
  {
    name: "create_mindmap",
    description: "Create a mind map diagram with radial layout and branches",
    inputSchema: {
      type: "object",
      properties: {
        centralTopic: {
          type: "string",
          description: "The central topic text of the mind map"
        },
        branches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "Text content of the branch" },
              children: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "Text content of the child node" }
                  },
                  required: ["text"]
                },
                description: "Child nodes of this branch"
              },
              color: { 
                type: "string", 
                enum: ["yellow", "blue", "green", "pink", "purple", "red", "orange", "dark_blue", "dark_green", "lightRed", "lightBlue", "lightGreen", "gray", "lightGray"],
                description: "Color for this branch" 
              }
            },
            required: ["text"]
          },
          description: "Array of main branches"
        },
        startPosition: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" }
          },
          description: "Position for the central node (default: {x: 400, y: 300})"
        },
        branchSpacing: {
          type: "number",
          description: "Spacing between branch and child nodes (default: 100)"
        }
      },
      required: ["centralTopic", "branches"]
    }
  },

  // Category 1: Basic creation tools
  {
    name: "create_shape_with_text",
    description: "Create a shape (rectangle, ellipse, polygon, star) with integrated text",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to display on the shape" },
        shapeType: { 
          type: "string", 
          enum: ["rectangle", "ellipse", "polygon", "star"],
          description: "Type of shape to create" 
        },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the shape (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the shape (default: {width: 150, height: 100})"
        },
        backgroundColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Background color RGB (default: light gray)"
        },
        textColor: {
          type: "object", 
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Text color RGB (default: black)"
        },
        fontSize: { type: "number", description: "Font size (default: 14)" },
        fontFamily: { type: "string", description: "Font family (default: Inter)" },
        fontWeight: { type: "string", description: "Font weight (default: Regular)" },
        textAlign: { 
          type: "string", 
          enum: ["LEFT", "CENTER", "RIGHT"], 
          description: "Text alignment (default: CENTER)" 
        },
        cornerRadius: { type: "number", description: "Corner radius for rectangles (default: 8)" },
        pointCount: { type: "number", description: "Number of points for polygons/stars (default: 5)" },
        innerRadius: { type: "number", description: "Inner radius ratio for stars (default: 0.4)" }
      },
      required: ["text", "shapeType"]
    }
  },
  {
    name: "create_code_block",
    description: "Create a code block with syntax highlighting styling",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The code content to display" },
        language: { type: "string", description: "Programming language for syntax highlighting (default: javascript)" },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the code block (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the code block (default: {width: 400, height: 300})"
        },
        backgroundColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Background color RGB (default: dark gray)"
        },
        theme: { 
          type: "string", 
          enum: ["light", "dark"], 
          description: "Color theme (default: dark)" 
        },
        showLineNumbers: { type: "boolean", description: "Whether to show line numbers (default: true)" }
      },
      required: ["code"]
    }
  },
  {
    name: "create_polygon", 
    description: "Create a polygon shape with specified number of points",
    inputSchema: {
      type: "object",
      properties: {
        pointCount: { type: "number", description: "Number of points for the polygon (3-20)" },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the polygon (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the polygon (default: {width: 100, height: 100})"
        },
        fills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              color: {
                type: "object",
                properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } }
              }
            }
          },
          description: "Fill colors for the polygon"
        },
        rotation: { type: "number", description: "Rotation in radians (default: 0)" }
      },
      required: ["pointCount"]
    }
  },
  {
    name: "create_star",
    description: "Create a star shape with specified points and inner radius",
    inputSchema: {
      type: "object",
      properties: {
        pointCount: { type: "number", description: "Number of points for the star (3-20)" },
        innerRadius: { type: "number", description: "Inner radius ratio (0.1 to 0.9)" },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the star (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the star (default: {width: 100, height: 100})"
        },
        fills: {
          type: "array", 
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              color: {
                type: "object",
                properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } }
              }
            }
          },
          description: "Fill colors for the star"
        },
        rotation: { type: "number", description: "Rotation in radians (default: 0)" }
      },
      required: ["pointCount", "innerRadius"]
    }
  },
  {
    name: "create_frame",
    description: "Create a frame container for organizing elements",
    inputSchema: {
      type: "object", 
      properties: {
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the frame (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the frame (default: {width: 200, height: 200})"
        },
        name: { type: "string", description: "Name for the frame (default: 'Frame')" },
        backgroundColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Background color RGB (default: white)"
        },
        cornerRadius: { type: "number", description: "Corner radius (default: 0)" },
        clipContent: { type: "boolean", description: "Whether to clip content (default: false)" }
      }
    }
  },
  {
    name: "create_section",
    description: "Create a section area for organizing content (native in FigJam, frame-based in Figma)",
    inputSchema: {
      type: "object",
      properties: {
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Position for the section (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Size of the section (default: {width: 300, height: 200})"
        },
        title: { type: "string", description: "Title for the section (default: 'Section')" },
        backgroundColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Background color RGB (default: light blue)"
        }
      }
    }
  },

  // Category 2: Advanced operations tools
  {
    name: "move_element",
    description: "Move an element to a new position with optional relative movement and animation",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of the element to move" },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "New position for the element"
        },
        relative: { type: "boolean", description: "If true, position is relative to current position (default: false)" },
        animate: { type: "boolean", description: "If true, animate the movement in FigJam (default: false)" }
      },
      required: ["elementId", "position"]
    }
  },
  {
    name: "resize_element",
    description: "Resize an element with anchor point control and proportion constraints",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of the element to resize" },
        size: {
          type: "object", 
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "New size for the element"
        },
        relative: { type: "boolean", description: "If true, size is relative to current size (default: false)" },
        constrainProportions: { type: "boolean", description: "If true, maintain aspect ratio (default: false)" },
        anchorPoint: { 
          type: "string", 
          enum: ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"],
          description: "Anchor point for resizing (default: TOP_LEFT)" 
        }
      },
      required: ["elementId", "size"]
    }
  },
  {
    name: "rotate_element",
    description: "Rotate an element by a specified angle with custom anchor point support",
    inputSchema: {
      type: "object",
      properties: {
        elementId: { type: "string", description: "ID of the element to rotate" },
        rotation: { type: "number", description: "Rotation angle in radians" },
        relative: { type: "boolean", description: "If true, rotation is relative to current rotation (default: false)" },
        anchorPoint: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Custom rotation anchor point (default: element center)"
        }
      },
      required: ["elementId", "rotation"]
    }
  },

  // Category 4: Smart canvas organization
  {
    name: "tidy_up",
    description: "Smart canvas organization with multiple strategies, grouping, and overlap removal",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Specific element IDs to organize (if not provided, organizes all page elements)"
        },
        strategy: {
          type: "string",
          enum: ["AUTO", "GRID", "FLOW", "CLUSTER"],
          description: "Organization strategy (default: AUTO)"
        },
        spacing: { type: "number", description: "Minimum spacing between elements in pixels (default: 20)" },
        alignment: {
          type: "string",
          enum: ["LEFT", "CENTER", "RIGHT", "TOP", "MIDDLE", "BOTTOM"],
          description: "Element alignment (default: TOP)"
        },
        groupSimilar: { type: "boolean", description: "Group elements with similar properties (default: true)" },
        removeOverlaps: { type: "boolean", description: "Remove overlapping elements (default: true)" },
        optimizeConnections: { type: "boolean", description: "Optimize connector paths in FigJam (default: false)" }
      }
    }
  },

  // Category 3: Connector management tools
  {
    name: "update_connector",
    description: "Update properties of an existing connector (stroke, endpoints, routing)",
    inputSchema: {
      type: "object",
      properties: {
        connectorId: { type: "string", description: "ID of the connector to update" },
        startElementId: { type: "string", description: "New start element ID" },
        endElementId: { type: "string", description: "New end element ID" },
        startPosition: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "New start position (if not connected to element)"
        },
        endPosition: {
          type: "object", 
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "New end position (if not connected to element)"
        },
        strokeWeight: { type: "number", description: "New stroke weight" },
        strokeColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "New stroke color RGB"
        },
        strokeStyle: { type: "string", enum: ["SOLID", "DASHED"], description: "Stroke style (default: SOLID)" },
        cornerRadius: { type: "number", description: "Corner radius for rounded connectors" },
        magnet: { type: "string", enum: ["AUTO", "TOP", "RIGHT", "BOTTOM", "LEFT"], description: "Magnet type (default: AUTO)" }
      },
      required: ["connectorId"]
    }
  },
  {
    name: "delete_connector",
    description: "Delete a specific connector by ID",
    inputSchema: {
      type: "object",
      properties: {
        connectorId: { type: "string", description: "ID of the connector to delete" }
      },
      required: ["connectorId"]
    }
  },
  {
    name: "query_connectors",
    description: "Find and analyze connectors on the canvas with filtering options",
    inputSchema: {
      type: "object",
      properties: {
        elementIds: {
          type: "array",
          items: { type: "string" },
          description: "Filter connectors connected to these element IDs"
        },
        region: {
          type: "object",
          properties: {
            x: { type: "number" }, y: { type: "number" },
            width: { type: "number" }, height: { type: "number" }
          },
          description: "Filter connectors within this region"
        },
        strokeWeightRange: {
          type: "object",
          properties: { min: { type: "number" }, max: { type: "number" } },
          description: "Filter by stroke weight range"
        },
        strokeColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Filter by stroke color (with tolerance)"
        },
        includeDetails: { type: "boolean", description: "Include detailed connector information (default: true)" }
      }
    }
  },
  {
    name: "optimize_connector_paths",
    description: "Smart path optimization for better connector routing and visual flow",
    inputSchema: {
      type: "object",
      properties: {
        connectorIds: {
          type: "array",
          items: { type: "string" },
          description: "Specific connector IDs to optimize (if not provided, optimizes all connectors)"
        },
        strategy: {
          type: "string",
          enum: ["SHORTEST", "AVOID_OVERLAPS", "MANHATTAN", "ORTHOGONAL"],
          description: "Optimization strategy (default: AVOID_OVERLAPS)"
        },
        margin: { type: "number", description: "Minimum margin from elements in pixels (default: 10)" },
        cornerRadius: { type: "number", description: "Corner radius for optimized paths (default: 8)" }
      }
    }
  },

  // Category 5: Advanced visualization tools
  {
    name: "create_chart",
    description: "Create various types of charts with data visualization (bar, line, pie, scatter, area, donut, histogram)",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["BAR", "LINE", "PIE", "SCATTER", "AREA", "DONUT", "HISTOGRAM"],
          description: "Type of chart to create"
        },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Data point label" },
              value: { type: "number", description: "Data point value" },
              color: {
                type: "object",
                properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
                description: "Custom color for this data point"
              }
            },
            required: ["label", "value"]
          },
          description: "Chart data points"
        },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Chart position (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Chart size (default: {width: 400, height: 300})"
        },
        title: { type: "string", description: "Chart title" },
        showLegend: { type: "boolean", description: "Show chart legend (default: true)" },
        showGrid: { type: "boolean", description: "Show grid lines (default: true)" },
        showAxes: { type: "boolean", description: "Show axes (default: true)" },
        colorScheme: {
          type: "string",
          enum: ["BLUE", "GREEN", "RED", "PURPLE", "ORANGE", "MULTI"],
          description: "Color scheme (default: MULTI)"
        },
        backgroundColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Background color (default: white)"
        },
        textColor: {
          type: "object",
          properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
          description: "Text color (default: dark gray)"
        },
        fontSize: { type: "number", description: "Font size (default: 12)" },
        fontFamily: { type: "string", description: "Font family (default: Inter)" }
      },
      required: ["type", "data"]
    }
  },
  {
    name: "create_diagram",
    description: "Create specialized diagrams (org chart, network, timeline, process flow, hierarchy, matrix)",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["ORG_CHART", "NETWORK", "TIMELINE", "PROCESS_FLOW", "HIERARCHY", "MATRIX"],
          description: "Type of diagram to create"
        },
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique node identifier" },
              label: { type: "string", description: "Node display text" },
              type: {
                type: "string",
                enum: ["LEADER", "MANAGER", "EMPLOYEE", "PROCESS", "DECISION", "EVENT", "MILESTONE"],
                description: "Node type for styling"
              },
              level: { type: "number", description: "Hierarchy level (0 = top level)" },
              parentId: { type: "string", description: "Parent node ID for hierarchical diagrams" },
              data: { type: "object", description: "Additional node data" },
              color: {
                type: "object",
                properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } },
                description: "Custom node color"
              },
              icon: { type: "string", description: "Node icon identifier" }
            },
            required: ["id", "label"]
          },
          description: "Diagram nodes"
        },
        connections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Source node ID" },
              to: { type: "string", description: "Target node ID" },
              label: { type: "string", description: "Connection label" },
              type: {
                type: "string",
                enum: ["SOLID", "DASHED", "DOTTED", "ARROW"],
                description: "Connection line type"
              },
              weight: { type: "number", description: "Connection weight/thickness" }
            },
            required: ["from", "to"]
          },
          description: "Node connections"
        },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Diagram position (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Diagram size (default: {width: 600, height: 400})"
        },
        title: { type: "string", description: "Diagram title" },
        layout: {
          type: "string",
          enum: ["TOP_DOWN", "LEFT_RIGHT", "RADIAL", "CIRCULAR", "MATRIX", "AUTO"],
          description: "Layout algorithm (default: AUTO)"
        },
        spacing: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Node spacing (default: {x: 120, y: 80})"
        }
      },
      required: ["type", "nodes"]
    }
  },
  {
    name: "create_visualization",
    description: "Create custom visualizations and dashboards with multiple data elements",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["CUSTOM", "DASHBOARD", "INFOGRAPHIC", "DATA_STORY", "COMPARISON", "TREND_ANALYSIS"],
          description: "Type of visualization to create"
        },
        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["CHART", "TEXT", "ICON", "IMAGE", "SHAPE", "METRIC"],
                description: "Element type"
              },
              data: { type: "object", description: "Element data/configuration" },
              position: {
                type: "object",
                properties: { x: { type: "number" }, y: { type: "number" } },
                description: "Custom element position"
              },
              size: {
                type: "object",
                properties: { width: { type: "number" }, height: { type: "number" } },
                description: "Custom element size"
              },
              style: { type: "object", description: "Element styling options" }
            },
            required: ["type", "data"]
          },
          description: "Visualization elements"
        },
        position: {
          type: "object",
          properties: { x: { type: "number" }, y: { type: "number" } },
          description: "Visualization position (default: {x: 0, y: 0})"
        },
        size: {
          type: "object",
          properties: { width: { type: "number" }, height: { type: "number" } },
          description: "Visualization size (default: {width: 800, height: 600})"
        },
        title: { type: "string", description: "Visualization title" },
        layout: {
          type: "string",
          enum: ["GRID", "FLOW", "LAYERED", "RADIAL"],
          description: "Element layout pattern (default: GRID)"
        },
        theme: {
          type: "string",
          enum: ["LIGHT", "DARK", "COLORFUL", "MINIMAL"],
          description: "Visual theme (default: LIGHT)"
        },
        responsive: { type: "boolean", description: "Enable responsive layout (default: false)" }
      },
      required: ["type", "elements"]
    }
  },
];