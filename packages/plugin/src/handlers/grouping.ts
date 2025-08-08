/**
 * Grouping Operations Handlers
 * Handles grouping and ungrouping of elements
 */

import { 
  createSuccessResponse, 
  createErrorResponse,
  selectAndFocus 
} from './utils';
import { GroupData } from './types';

/**
 * Group multiple elements together
 */
export async function handleGroupElements(id: string, data: GroupData): Promise<void> {
  try {
    const { nodeIds, groupName } = data;
    console.log("[grouping] Grouping elements:", nodeIds, groupName);

    // Get all nodes with validation
    const nodes: SceneNode[] = [];
    const notFoundIds: string[] = [];

    for (const nodeId of nodeIds) {
      const node = figma.getNodeById(nodeId) as SceneNode;
      if (!node) {
        notFoundIds.push(nodeId);
        continue;
      }
      nodes.push(node);
    }

    if (notFoundIds.length > 0) {
      throw new Error(`Elements not found: ${notFoundIds.join(', ')}`);
    }

    if (nodes.length === 0) {
      throw new Error("No valid elements found to group");
    }

    // Create group
    const group = figma.group(nodes, figma.currentPage);
    group.name = groupName || "Group";

    // Select the created group
    selectAndFocus([group]);

    // Send response
    const result = {
      groupId: group.id,
      groupName: group.name,
      elementCount: nodes.length,
      elementIds: nodeIds,
      message: `Grouped ${nodes.length} elements into "${group.name}" (ID: ${group.id})`
    };

    createSuccessResponse(id, result, "Elements grouped successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "group_elements");
    throw error;
  }
}

/**
 * Ungroup a group of elements
 */
export async function handleUngroupElements(id: string, data: { groupId: string }): Promise<void> {
  try {
    const { groupId } = data;
    console.log("[grouping] Ungrouping elements:", groupId);

    // Get the group node
    const groupNode = figma.getNodeById(groupId) as GroupNode;
    
    if (!groupNode) {
      throw new Error(`Group with ID ${groupId} not found`);
    }

    if (groupNode.type !== "GROUP") {
      throw new Error(`Element ${groupId} is not a group (type: ${groupNode.type})`);
    }

    // Get children before ungrouping
    const children = [...groupNode.children];
    const childIds = children.map(child => child.id);

    // Ungroup by moving children to parent
    const parent = groupNode.parent;
    if (!parent) {
      throw new Error("Group has no parent to ungroup into");
    }

    // Move all children to the group's parent
    children.forEach(child => {
      parent.appendChild(child);
    });

    // Remove the empty group
    groupNode.remove();

    // Select the ungrouped elements
    selectAndFocus(childIds);

    // Send response
    const result = {
      ungroupedElementIds: childIds,
      elementCount: childIds.length,
      originalGroupId: groupId,
      message: `Ungrouped ${childIds.length} elements from group ${groupId}`
    };

    createSuccessResponse(id, result, "Group ungrouped successfully");
  } catch (error) {
    createErrorResponse(id, error as Error, "ungroup_elements");
    throw error;
  }
}