# SCI Canvas Database Layer

Complete database layer for the Supply Chain Intelligence canvas application using Dexie.js (IndexedDB wrapper).

## Overview

This database layer provides persistent storage for:
- **Boards**: Canvas workspaces with viewport state
- **Nodes**: Positioned elements on the canvas (stocks, charts, text, etc.)
- **Edges**: Connections between nodes
- **Groups**: Collections of related nodes
- **Timeseries**: OHLCV candle data for stock charts
- **Overlay Cache**: Computed technical indicators and overlays
- **Agent Runs**: AI agent execution history
- **Events**: Market and application events

## Installation

Dependencies are already installed in the project:
```json
{
  "dexie": "^4.2.1"
}
```

## Database Schema

### Tables

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| boards | id (auto) | name, createdAt, updatedAt |
| nodes | id (auto) | boardId, type, zIndex, locked, createdAt |
| edges | id (auto) | boardId, sourceId, targetId, createdAt |
| groups | id (auto) | boardId, name, createdAt |
| timeseries | [symbol+resolution+timestamp] | symbol, resolution, timestamp |
| overlayCache | [symbol+overlayId+resolution+windowStart] | symbol, overlayId, resolution, windowStart, computedAt |
| agentRuns | id (auto) | agentType, status, startedAt, completedAt |
| events | id (auto) | symbol, timestamp, type, createdAt |

## Usage

### Import

```typescript
import {
  db,
  createBoard,
  addNode,
  storeCandles,
  createEvent
} from './db';
```

### Board Operations

```typescript
// Create a new board
const board = await createBoard('My Canvas');

// Get a board
const board = await getBoard(1);

// Update board viewport
await updateBoard(1, {
  viewport: { x: 100, y: 200, zoom: 1.5 }
});

// Get all boards
const boards = await getAllBoards();

// Delete board and all its data
await deleteBoard(1);

// Clone a board
const clonedBoard = await cloneBoard(1, 'Copy of My Canvas');

// Export board data
const data = await exportBoardData(1);
```

### Node Operations

```typescript
// Add a node to a board
const node = await addNode({
  boardId: 1,
  type: 'stock',
  position: { x: 100, y: 200 },
  size: { width: 300, height: 400 },
  data: { ticker: 'AAPL', name: 'Apple Inc.' },
  zIndex: 1,
  locked: false
});

// Get all nodes for a board
const nodes = await getNodesForBoard(1);

// Update node position (optimized for frequent updates)
await updateNodePosition(nodeId, { x: 150, y: 250 });

// Update node z-index
await updateNodeZIndex(nodeId, 10);

// Delete node (also deletes connected edges)
await deleteNode(nodeId);

// Bulk add nodes
const nodes = await addNodes([
  { boardId: 1, type: 'chart', ... },
  { boardId: 1, type: 'text', ... }
]);
```

### Edge Operations

```typescript
// Create an edge between two nodes
const edge = await addEdge({
  boardId: 1,
  sourceId: 1,
  targetId: 2,
  type: 'bezier',
  label: 'depends on'
});

// Get all edges for a board
const edges = await getEdgesForBoard(1);

// Get edges connected to a specific node
const nodeEdges = await getEdgesForNode(nodeId);

// Delete an edge
await deleteEdge(edgeId);
```

### Group Operations

```typescript
// Create a group
const group = await createGroup({
  boardId: 1,
  name: 'Tech Stocks',
  nodeIds: [1, 2, 3],
  color: '#3b82f6',
  collapsed: false
});

// Add node to group
await addNodeToGroup(groupId, nodeId);

// Remove node from group
await removeNodeFromGroup(groupId, nodeId);

// Get all nodes in a group
const groupNodes = await getNodesInGroup(groupId);
```

### Timeseries Operations

```typescript
// Store candle data
await storeCandles('AAPL', 'D', [
  { timestamp: 1700000000000, open: 180, high: 185, low: 179, close: 183, volume: 50000000 },
  { timestamp: 1700086400000, open: 183, high: 187, low: 182, close: 186, volume: 52000000 }
]);

// Get candles in a time range
const candles = await getCandles('AAPL', 'D', fromTimestamp, toTimestamp);

// Get latest candle
const latest = await getLatestCandle('AAPL', 'D');

// Get available date range
const range = await getCandleRange('AAPL', 'D');
// { from: 1700000000000, to: 1750000000000, count: 250 }

// Get statistics
const stats = await getCandleStats('AAPL', 'D');

// Get candles with pagination
const page = await getCandlesPaginated('AAPL', 'D', 0, 100);

// Find data gaps
const gaps = await findDataGaps('AAPL', 'D', 86400000); // 1 day in ms

// Clean up old data
await clearOldCandles(Date.now() - 365 * 24 * 60 * 60 * 1000); // older than 1 year
```

### Overlay Cache Operations

```typescript
// Store computed overlay
await storeOverlayCache({
  symbol: 'AAPL',
  overlayId: 'sma_50',
  resolution: 'D',
  windowStart: 1700000000000,
  windowEnd: 1750000000000,
  data: { values: [180, 181, 182, ...] }
});

// Get cached overlay
const cache = await getOverlayCache('AAPL', 'sma_50', 'D', 1700000000000);

// Clear old cache
await clearOldOverlayCache(Date.now() - 7 * 24 * 60 * 60 * 1000); // older than 7 days
```

### Agent Run Operations

```typescript
// Create an agent run
const run = await createAgentRun({
  agentType: 'stock_analysis',
  status: 'pending',
  input: { ticker: 'AAPL' }
});

// Start the run
await startAgentRun(run.id!);

// Complete successfully
await completeAgentRun(run.id!, {
  analysis: 'Strong buy recommendation',
  confidence: 0.85
});

// Or fail
await failAgentRun(run.id!, 'API rate limit exceeded');

// Get runs by type
const stockAnalysisRuns = await getAgentRunsByType('stock_analysis');

// Get running runs
const activeRuns = await getAgentRunsByStatus('running');

// Get statistics
const stats = await getAgentRunStats();

// Retry a failed run
const newRun = await retryAgentRun(failedRunId);
```

### Event Operations

```typescript
// Create an event
const event = await createEvent({
  symbol: 'AAPL',
  timestamp: Date.now(),
  type: 'earnings',
  data: { eps: 1.52, revenue: 89.5e9 }
});

// Get events for a symbol
const events = await getEventsForSymbol('AAPL');

// Get events by type
const earningsEvents = await getEventsByType('earnings');

// Get events in time range
const recentEvents = await getEventsInRange(
  Date.now() - 30 * 24 * 60 * 60 * 1000,
  Date.now()
);

// Get upcoming events
const upcoming = await getUpcomingEvents(10);

// Bulk create events
await bulkCreateEvents([
  { symbol: 'AAPL', timestamp: ..., type: 'earnings', data: {...} },
  { symbol: 'MSFT', timestamp: ..., type: 'dividend', data: {...} }
]);
```

## Type Definitions

### Node Types
```typescript
type NodeType =
  | 'stock'
  | 'chart'
  | 'text'
  | 'image'
  | 'chatbot'
  | 'ticker'
  | 'news'
  | 'metrics'
  | 'custom';
```

### Edge Types
```typescript
type EdgeType = 'straight' | 'bezier' | 'step' | 'smoothstep';
```

### Resolution Types
```typescript
type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
```

### Agent Types
```typescript
type AgentType =
  | 'stock_analysis'
  | 'sentiment_analysis'
  | 'supply_chain_analysis'
  | 'technical_analysis'
  | 'news_aggregation'
  | 'custom';
```

### Event Types
```typescript
type EventType =
  | 'earnings'
  | 'dividend'
  | 'split'
  | 'news'
  | 'alert'
  | 'price_target'
  | 'analyst_rating'
  | 'custom';
```

## Database Utilities

### Clear All Data
```typescript
// Clear all boards (WARNING: destructive)
await clearAllBoards();

// Clear all timeseries data
await clearAllTimeseriesData();

// Clear all agent runs
await clearAllAgentRuns();

// Clear all events
await clearAllEvents();
```

### Statistics
```typescript
// Timeseries stats
const tsStats = await getTimeseriesStats();
// { totalCandles, totalOverlays, uniqueSymbols, oldestTimestamp, newestTimestamp }

// Agent run stats
const agentStats = await getAgentRunStats();
// { total, pending, running, completed, failed, cancelled, byType }

// Event stats
const eventStats = await getEventStats();
// { total, byType, bySymbol, earliestTimestamp, latestTimestamp }
```

## Best Practices

### 1. Use Transactions for Related Operations
```typescript
import { db } from './db';

await db.transaction('rw', [db.nodes, db.edges], async () => {
  const node = await addNode({...});
  await addEdge({ sourceId: existingNodeId, targetId: node.id, ... });
});
```

### 2. Clean Up Old Data Periodically
```typescript
// Clean up weekly
setInterval(async () => {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await clearOldOverlayCache(oneWeekAgo);
  await clearFinishedAgentRuns();
}, 24 * 60 * 60 * 1000);
```

### 3. Use Pagination for Large Datasets
```typescript
// Instead of loading all candles at once
const allCandles = await getCandles('AAPL', 'D', 0, Number.MAX_SAFE_INTEGER);

// Use pagination
const page1 = await getCandlesPaginated('AAPL', 'D', 0, 100);
const page2 = await getCandlesPaginated('AAPL', 'D', 100, 100);
```

### 4. Optimize Node Position Updates
```typescript
// Use the optimized position update function
await updateNodePosition(nodeId, { x: 150, y: 250 });

// Instead of generic update
await updateNode(nodeId, { position: { x: 150, y: 250 } });
```

### 5. Handle Errors Gracefully
```typescript
try {
  const board = await getBoard(nonExistentId);
  if (!board) {
    console.error('Board not found');
  }
} catch (error) {
  console.error('Database error:', error);
}
```

## Performance Considerations

- **Compound Keys**: Timeseries uses compound keys for efficient range queries
- **Indexes**: Critical fields are indexed for faster lookups
- **Bulk Operations**: Use `bulkAdd`, `bulkPut`, and `bulkGet` for multiple records
- **Pagination**: Use offset/limit for large result sets
- **Caching**: Overlay cache prevents recomputing technical indicators

## Migration

The database schema is versioned. Future schema changes should increment the version:

```typescript
// In schema.ts
this.version(2).stores({
  boards: '++id, name, createdAt, updatedAt, archived', // Added 'archived'
  // ... other tables
}).upgrade(tx => {
  // Migration logic
  return tx.boards.toCollection().modify(board => {
    board.archived = false;
  });
});
```

## License

Part of the SCI Canvas Application
