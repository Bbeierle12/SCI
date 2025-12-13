import { db } from './schema';
import type { Board, Node, Edge, Group } from './schema';

/**
 * Board CRUD Operations
 */

/**
 * Create a new board with default viewport
 * @param name - Name of the board
 * @returns The created board with assigned ID
 */
export async function createBoard(name: string): Promise<Board> {
  const now = Date.now();
  const board: Board = {
    name,
    createdAt: now,
    updatedAt: now,
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  };

  const id = await db.boards.add(board);
  return { ...board, id };
}

/**
 * Get a board by ID
 * @param id - Board ID
 * @returns The board or undefined if not found
 */
export async function getBoard(id: number): Promise<Board | undefined> {
  return await db.boards.get(id);
}

/**
 * Get all boards
 * @returns Array of all boards
 */
export async function getAllBoards(): Promise<Board[]> {
  return await db.boards.toArray();
}

/**
 * Update a board
 * @param id - Board ID
 * @param updates - Partial board data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateBoard(
  id: number,
  updates: Partial<Omit<Board, 'id' | 'createdAt'>>
): Promise<number> {
  return await db.boards.update(id, {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Delete a board and all its associated nodes, edges, and groups
 * @param id - Board ID
 * @returns Object with counts of deleted items
 */
export async function deleteBoard(id: number): Promise<{
  board: number;
  nodes: number;
  edges: number;
  groups: number;
}> {
  return await db.transaction('rw', [db.boards, db.nodes, db.edges, db.groups], async () => {
    // Delete all associated data first
    const nodesDeleted = await db.nodes.where('boardId').equals(id).delete();
    const edgesDeleted = await db.edges.where('boardId').equals(id).delete();
    const groupsDeleted = await db.groups.where('boardId').equals(id).delete();

    // Delete the board itself
    const boardDeleted = await db.boards.delete(id);

    return {
      board: boardDeleted ? 1 : 0,
      nodes: nodesDeleted,
      edges: edgesDeleted,
      groups: groupsDeleted
    };
  });
}

/**
 * Node Operations
 */

/**
 * Get all nodes for a specific board
 * @param boardId - Board ID
 * @returns Array of nodes belonging to the board
 */
export async function getNodesForBoard(boardId: number): Promise<Node[]> {
  return await db.nodes.where('boardId').equals(boardId).toArray();
}

/**
 * Get a single node by ID
 * @param id - Node ID
 * @returns The node or undefined if not found
 */
export async function getNode(id: number): Promise<Node | undefined> {
  return await db.nodes.get(id);
}

/**
 * Add a node to a board
 * @param node - Node data (without id)
 * @returns The created node with assigned ID
 */
export async function addNode(node: Omit<Node, 'id' | 'createdAt' | 'updatedAt'>): Promise<Node> {
  const now = Date.now();
  const nodeWithTimestamps: Node = {
    ...node,
    createdAt: now,
    updatedAt: now
  };

  const id = await db.nodes.add(nodeWithTimestamps);
  return { ...nodeWithTimestamps, id };
}

/**
 * Update a node
 * @param id - Node ID
 * @param updates - Partial node data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateNode(
  id: number,
  updates: Partial<Omit<Node, 'id' | 'createdAt'>>
): Promise<number> {
  return await db.nodes.update(id, {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Delete a node
 * @param id - Node ID
 * @returns Number of deleted records (1 if successful, 0 if not found)
 */
export async function deleteNode(id: number): Promise<number> {
  return await db.transaction('rw', [db.nodes, db.edges], async () => {
    // Also delete any edges connected to this node
    await db.edges.where('sourceId').equals(id).delete();
    await db.edges.where('targetId').equals(id).delete();

    // Delete the node
    const deleted = await db.nodes.delete(id);
    return deleted ? 1 : 0;
  });
}

/**
 * Bulk add multiple nodes
 * @param nodes - Array of nodes to add
 * @returns Array of created nodes with assigned IDs
 */
export async function addNodes(nodes: Omit<Node, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Node[]> {
  const now = Date.now();
  const nodesWithTimestamps = nodes.map(node => ({
    ...node,
    createdAt: now,
    updatedAt: now
  }));

  const ids = await db.nodes.bulkAdd(nodesWithTimestamps, { allKeys: true });

  return nodesWithTimestamps.map((node, index) => ({
    ...node,
    id: ids[index] as number
  }));
}

/**
 * Update node position (optimized for frequent updates)
 * @param id - Node ID
 * @param position - New position
 * @returns Number of updated records
 */
export async function updateNodePosition(
  id: number,
  position: { x: number; y: number }
): Promise<number> {
  return await db.nodes.update(id, {
    position,
    updatedAt: Date.now()
  });
}

/**
 * Update node z-index
 * @param id - Node ID
 * @param zIndex - New z-index value
 * @returns Number of updated records
 */
export async function updateNodeZIndex(id: number, zIndex: number): Promise<number> {
  return await db.nodes.update(id, {
    zIndex,
    updatedAt: Date.now()
  });
}

/**
 * Edge Operations
 */

/**
 * Get all edges for a specific board
 * @param boardId - Board ID
 * @returns Array of edges belonging to the board
 */
export async function getEdgesForBoard(boardId: number): Promise<Edge[]> {
  return await db.edges.where('boardId').equals(boardId).toArray();
}

/**
 * Get a single edge by ID
 * @param id - Edge ID
 * @returns The edge or undefined if not found
 */
export async function getEdge(id: number): Promise<Edge | undefined> {
  return await db.edges.get(id);
}

/**
 * Add an edge between two nodes
 * @param edge - Edge data (without id)
 * @returns The created edge with assigned ID
 */
export async function addEdge(edge: Omit<Edge, 'id' | 'createdAt'>): Promise<Edge> {
  const edgeWithTimestamp: Edge = {
    ...edge,
    createdAt: Date.now()
  };

  const id = await db.edges.add(edgeWithTimestamp);
  return { ...edgeWithTimestamp, id };
}

/**
 * Update an edge
 * @param id - Edge ID
 * @param updates - Partial edge data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateEdge(
  id: number,
  updates: Partial<Omit<Edge, 'id' | 'createdAt'>>
): Promise<number> {
  return await db.edges.update(id, updates);
}

/**
 * Delete an edge
 * @param id - Edge ID
 * @returns Number of deleted records (1 if successful, 0 if not found)
 */
export async function deleteEdge(id: number): Promise<number> {
  const deleted = await db.edges.delete(id);
  return deleted ? 1 : 0;
}

/**
 * Get all edges connected to a specific node
 * @param nodeId - Node ID
 * @returns Array of edges where node is source or target
 */
export async function getEdgesForNode(nodeId: number): Promise<Edge[]> {
  const sourceEdges = await db.edges.where('sourceId').equals(nodeId).toArray();
  const targetEdges = await db.edges.where('targetId').equals(nodeId).toArray();

  // Combine and deduplicate
  const edgeMap = new Map<number, Edge>();
  [...sourceEdges, ...targetEdges].forEach(edge => {
    if (edge.id !== undefined) {
      edgeMap.set(edge.id, edge);
    }
  });

  return Array.from(edgeMap.values());
}

/**
 * Group Operations
 */

/**
 * Get all groups for a specific board
 * @param boardId - Board ID
 * @returns Array of groups belonging to the board
 */
export async function getGroupsForBoard(boardId: number): Promise<Group[]> {
  return await db.groups.where('boardId').equals(boardId).toArray();
}

/**
 * Get a single group by ID
 * @param id - Group ID
 * @returns The group or undefined if not found
 */
export async function getGroup(id: number): Promise<Group | undefined> {
  return await db.groups.get(id);
}

/**
 * Create a new group
 * @param group - Group data (without id)
 * @returns The created group with assigned ID
 */
export async function createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
  const now = Date.now();
  const groupWithTimestamps: Group = {
    ...group,
    createdAt: now,
    updatedAt: now
  };

  const id = await db.groups.add(groupWithTimestamps);
  return { ...groupWithTimestamps, id };
}

/**
 * Update a group
 * @param id - Group ID
 * @param updates - Partial group data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateGroup(
  id: number,
  updates: Partial<Omit<Group, 'id' | 'createdAt'>>
): Promise<number> {
  return await db.groups.update(id, {
    ...updates,
    updatedAt: Date.now()
  });
}

/**
 * Delete a group (does not delete the nodes in the group)
 * @param id - Group ID
 * @returns Number of deleted records (1 if successful, 0 if not found)
 */
export async function deleteGroup(id: number): Promise<number> {
  const deleted = await db.groups.delete(id);
  return deleted ? 1 : 0;
}

/**
 * Add a node to a group
 * @param groupId - Group ID
 * @param nodeId - Node ID to add
 * @returns Number of updated records
 */
export async function addNodeToGroup(groupId: number, nodeId: number): Promise<number> {
  const group = await db.groups.get(groupId);
  if (!group) return 0;

  const nodeIds = group.nodeIds.includes(nodeId)
    ? group.nodeIds
    : [...group.nodeIds, nodeId];

  return await db.groups.update(groupId, {
    nodeIds,
    updatedAt: Date.now()
  });
}

/**
 * Remove a node from a group
 * @param groupId - Group ID
 * @param nodeId - Node ID to remove
 * @returns Number of updated records
 */
export async function removeNodeFromGroup(groupId: number, nodeId: number): Promise<number> {
  const group = await db.groups.get(groupId);
  if (!group) return 0;

  const nodeIds = group.nodeIds.filter(id => id !== nodeId);

  return await db.groups.update(groupId, {
    nodeIds,
    updatedAt: Date.now()
  });
}

/**
 * Get all nodes in a group
 * @param groupId - Group ID
 * @returns Array of nodes in the group
 */
export async function getNodesInGroup(groupId: number): Promise<Node[]> {
  const group = await db.groups.get(groupId);
  if (!group) return [];

  const nodes = await db.nodes.bulkGet(group.nodeIds);
  return nodes.filter((node): node is Node => node !== undefined);
}

/**
 * Utility Functions
 */

/**
 * Clone a board with all its nodes, edges, and groups
 * @param boardId - Board ID to clone
 * @param newName - Name for the cloned board
 * @returns The cloned board with new ID
 */
export async function cloneBoard(boardId: number, newName: string): Promise<Board | null> {
  return await db.transaction('rw', [db.boards, db.nodes, db.edges, db.groups], async () => {
    const originalBoard = await db.boards.get(boardId);
    if (!originalBoard) return null;

    // Create new board
    const newBoard = await createBoard(newName);
    if (!newBoard.id) return null;

    // Clone nodes
    const originalNodes = await getNodesForBoard(boardId);
    const nodeIdMap = new Map<number, number>();

    for (const node of originalNodes) {
      const { id, createdAt, updatedAt, ...nodeData } = node;
      const newNode = await addNode({
        ...nodeData,
        boardId: newBoard.id
      });
      if (id !== undefined && newNode.id !== undefined) {
        nodeIdMap.set(id, newNode.id);
      }
    }

    // Clone edges with updated node references
    const originalEdges = await getEdgesForBoard(boardId);
    for (const edge of originalEdges) {
      const { id, createdAt, ...edgeData } = edge;
      const newSourceId = nodeIdMap.get(edgeData.sourceId);
      const newTargetId = nodeIdMap.get(edgeData.targetId);

      if (newSourceId !== undefined && newTargetId !== undefined) {
        await addEdge({
          ...edgeData,
          boardId: newBoard.id,
          sourceId: newSourceId,
          targetId: newTargetId
        });
      }
    }

    // Clone groups with updated node references
    const originalGroups = await getGroupsForBoard(boardId);
    for (const group of originalGroups) {
      const { id, createdAt, updatedAt, ...groupData } = group;
      const newNodeIds = groupData.nodeIds
        .map(oldId => nodeIdMap.get(oldId))
        .filter((id): id is number => id !== undefined);

      await createGroup({
        ...groupData,
        boardId: newBoard.id,
        nodeIds: newNodeIds
      });
    }

    return newBoard;
  });
}

/**
 * Export board data as JSON
 * @param boardId - Board ID to export
 * @returns JSON-serializable object with board data
 */
export async function exportBoardData(boardId: number): Promise<{
  board: Board;
  nodes: Node[];
  edges: Edge[];
  groups: Group[];
} | null> {
  const board = await getBoard(boardId);
  if (!board) return null;

  const nodes = await getNodesForBoard(boardId);
  const edges = await getEdgesForBoard(boardId);
  const groups = await getGroupsForBoard(boardId);

  return {
    board,
    nodes,
    edges,
    groups
  };
}

/**
 * Clear all data from all boards
 * WARNING: This will delete all boards and their data
 * @returns Object with counts of deleted items
 */
export async function clearAllBoards(): Promise<{
  boards: number;
  nodes: number;
  edges: number;
  groups: number;
}> {
  return await db.transaction('rw', [db.boards, db.nodes, db.edges, db.groups], async () => {
    const boardsDeleted = await db.boards.clear();
    const nodesDeleted = await db.nodes.clear();
    const edgesDeleted = await db.edges.clear();
    const groupsDeleted = await db.groups.clear();

    return {
      boards: boardsDeleted,
      nodes: nodesDeleted,
      edges: edgesDeleted,
      groups: groupsDeleted
    };
  });
}
