import Dexie, { type EntityTable } from 'dexie';

/**
 * Board represents a canvas workspace with a viewport state
 */
export interface Board {
  id?: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Node type defines the kind of content displayed in a canvas node
 */
export type NodeType =
  | 'stock'
  | 'chart'
  | 'text'
  | 'image'
  | 'chatbot'
  | 'ticker'
  | 'news'
  | 'metrics'
  | 'custom';

/**
 * Node represents a positioned element on the canvas
 */
export interface Node {
  id?: number;
  boardId: number;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  data: Record<string, unknown>;
  zIndex: number;
  locked: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Edge type defines the visual style of connections between nodes
 */
export type EdgeType = 'straight' | 'bezier' | 'step' | 'smoothstep';

/**
 * Edge represents a connection between two nodes
 */
export interface Edge {
  id?: number;
  boardId: number;
  sourceId: number;
  targetId: number;
  type: EdgeType;
  label?: string;
  style?: Record<string, unknown>;
  createdAt?: number;
}

/**
 * Group represents a collection of related nodes
 */
export interface Group {
  id?: number;
  boardId: number;
  name: string;
  nodeIds: number[];
  color: string;
  collapsed: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Resolution for timeseries data
 */
export type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';

/**
 * Timeseries candle data (OHLCV)
 */
export interface TimeseriesCandle {
  symbol: string;
  resolution: Resolution;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Overlay cache stores computed technical indicators or overlays
 */
export interface OverlayCache {
  symbol: string;
  overlayId: string;
  resolution: Resolution;
  windowStart: number;
  windowEnd: number;
  data: Record<string, unknown>;
  computedAt: number;
}

/**
 * Agent run status
 */
export type AgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Agent type defines the kind of AI agent
 */
export type AgentType =
  | 'stock_analysis'
  | 'sentiment_analysis'
  | 'supply_chain_analysis'
  | 'technical_analysis'
  | 'news_aggregation'
  | 'custom';

/**
 * AgentRun represents an execution of an AI agent task
 */
export interface AgentRun {
  id?: number;
  agentType: AgentType;
  status: AgentRunStatus;
  startedAt: number;
  completedAt?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Event type for market events
 */
export type EventType =
  | 'earnings'
  | 'dividend'
  | 'split'
  | 'news'
  | 'alert'
  | 'price_target'
  | 'analyst_rating'
  | 'custom';

/**
 * Event represents a time-based market or application event
 */
export interface Event {
  id?: number;
  symbol: string;
  timestamp: number;
  type: EventType;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: number;
}

/**
 * Dexie database class for SCI Canvas Application
 */
export class SCIDatabase extends Dexie {
  boards!: EntityTable<Board, 'id'>;
  nodes!: EntityTable<Node, 'id'>;
  edges!: EntityTable<Edge, 'id'>;
  groups!: EntityTable<Group, 'id'>;
  timeseries!: EntityTable<TimeseriesCandle, '[symbol+resolution+timestamp]'>;
  overlayCache!: EntityTable<OverlayCache, '[symbol+overlayId+resolution+windowStart]'>;
  agentRuns!: EntityTable<AgentRun, 'id'>;
  events!: EntityTable<Event, 'id'>;

  constructor() {
    super('SCIDatabase');

    this.version(1).stores({
      boards: '++id, name, createdAt, updatedAt',
      nodes: '++id, boardId, type, zIndex, locked, createdAt',
      edges: '++id, boardId, sourceId, targetId, createdAt',
      groups: '++id, boardId, name, createdAt',
      timeseries: '[symbol+resolution+timestamp], symbol, resolution, timestamp',
      overlayCache: '[symbol+overlayId+resolution+windowStart], symbol, overlayId, resolution, windowStart, computedAt',
      agentRuns: '++id, agentType, status, startedAt, completedAt',
      events: '++id, symbol, timestamp, type, createdAt'
    });
  }
}

// Export singleton database instance
export const db = new SCIDatabase();
