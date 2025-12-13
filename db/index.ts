/**
 * SCI Canvas Database Layer
 *
 * This module provides a complete database layer using Dexie.js for the
 * Supply Chain Intelligence canvas application.
 *
 * @module db
 */

// Export database instance and schema types
export { db } from './schema';
export type {
  Board,
  Node,
  NodeType,
  Edge,
  EdgeType,
  Group,
  TimeseriesCandle,
  Resolution,
  OverlayCache,
  AgentRun,
  AgentRunStatus,
  AgentType,
  Event,
  EventType
} from './schema';

// Export board store functions
export {
  // Board operations
  createBoard,
  getBoard,
  getAllBoards,
  updateBoard,
  deleteBoard,
  cloneBoard,
  exportBoardData,
  clearAllBoards,

  // Node operations
  getNode,
  getNodesForBoard,
  addNode,
  addNodes,
  updateNode,
  deleteNode,
  updateNodePosition,
  updateNodeZIndex,

  // Edge operations
  getEdge,
  getEdgesForBoard,
  getEdgesForNode,
  addEdge,
  updateEdge,
  deleteEdge,

  // Group operations
  getGroup,
  getGroupsForBoard,
  createGroup,
  updateGroup,
  deleteGroup,
  addNodeToGroup,
  removeNodeFromGroup,
  getNodesInGroup
} from './boardStore';

// Export timeseries store functions
export {
  // Candle operations
  storeCandles,
  getCandles,
  getLatestCandle,
  getCandleRange,
  getCandleStats,
  getCandlesPaginated,
  clearOldCandles,
  deleteCandlesForSymbol,
  deleteCandlesForSymbolResolution,
  bulkImportCandles,

  // Overlay cache operations
  storeOverlayCache,
  getOverlayCache,
  getOverlayCachesForSymbol,
  clearOldOverlayCache,
  deleteOverlayCacheForSymbol,
  deleteOverlayCache,

  // Utility operations
  getAllSymbols,
  getAvailableResolutions,
  hasCandlesInRange,
  getTimeseriesStats,
  clearAllTimeseriesData,
  findDataGaps
} from './timeseriesStore';

// Export agent store functions
export {
  // Agent run operations
  createAgentRun,
  getAgentRun,
  getAllAgentRuns,
  getAgentRunsByType,
  getAgentRunsByStatus,
  updateAgentRun,
  completeAgentRun,
  failAgentRun,
  cancelAgentRun,
  startAgentRun,
  deleteAgentRun,
  getAgentRunsPaginated,
  getAgentRunsInRange,
  getAgentRunStats,
  clearOldAgentRuns,
  clearFinishedAgentRuns,
  getLatestAgentRun,
  getAgentRunDuration,
  retryAgentRun,
  clearAllAgentRuns
} from './agentStore';

// Export event store functions
export {
  // Event operations
  createEvent,
  getEvent,
  getAllEvents,
  getEventsForSymbol,
  getEventsByType,
  getEventsForSymbolAndType,
  getEventsInRange,
  getEventsForSymbolInRange,
  updateEvent,
  deleteEvent,
  deleteEventsForSymbol,
  deleteEventsByType,
  clearOldEvents,
  getEventsPaginated,
  getUpcomingEvents,
  getLatestEventForSymbol,
  getEventStats,
  getSymbolsWithEvents,
  bulkCreateEvents,
  hasEventAt,
  getEventCountsByType,
  clearAllEvents
} from './eventStore';
