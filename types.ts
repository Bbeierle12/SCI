
export interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  category: string;
  role: string;
  description: string;
  marketCap: string;
  risk: string;
  growthPotential: string;
  region: string;
  tags: string[];
}

export interface PrivateCompany {
  name: string;
  status: string;
  owners: string;
  role: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SearchResult {
  text: string;
  sources: GroundingSource[];
}

export interface IntelligenceMetrics {
  sentimentScore: number;
  sentimentTrend: 'Bullish' | 'Bearish' | 'Neutral';
  supplyChainHealth: number;
  innovationIndex: number;
  technicalSupport: string;
  technicalResistance: string;
}

export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'RISK_CHANGE';

export interface AlertConfig {
  id: string;
  ticker: string;
  type: AlertType;
  value: number | string;
  active: boolean;
  triggered: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

// ===== FINNHUB API TYPES =====

export interface FinnhubQuote {
  c: number;   // Current price
  d: number;   // Change (absolute)
  dp: number;  // Change (percent)
  h: number;   // Day high
  l: number;   // Day low
  o: number;   // Open price
  pc: number;  // Previous close
  t: number;   // Timestamp
}

export interface FinnhubProfile {
  name: string;
  ticker: string;
  logo: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  ipo: string;
  country: string;
  weburl: string;
  exchange: string;
  currency: string;
}

export interface FinnhubNewsItem {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubMetrics {
  metric: {
    peNormalizedAnnual?: number;
    epsNormalizedAnnual?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    marketCapitalization?: number;
    dividendYieldIndicatedAnnual?: number;
    revenueGrowthQuarterlyYoy?: number;
    '10DayAverageTradingVolume'?: number;
    beta?: number;
  };
}

export interface FinnhubResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: number;
}

export interface RefreshState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  autoRefreshEnabled: boolean;
  intervalMs: number;
  error: string | null;
}

// ===== FINNHUB WEBSOCKET TYPES =====

export interface FinnhubTrade {
  p: number;  // Price
  s: string;  // Symbol
  t: number;  // Timestamp (epoch ms)
  v: number;  // Volume
  c?: string[]; // Conditions (optional)
}

export interface FinnhubWsState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  subscribedSymbols: string[];
}

export interface QuoteTick {
  t: number;  // epoch ms
  p: number;  // price
  v?: number; // volume
}

// ===== CANVAS TYPES =====

export interface Board {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  viewport: Viewport;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type CanvasNodeType = 'ticker' | 'event' | 'note' | 'callout';

export interface CanvasNode {
  id: string;
  boardId: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: TickerNodeData | EventNodeData | NoteNodeData | CalloutNodeData;
  zIndex: number;
  locked: boolean;
}

export interface TickerNodeData {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  category?: string;
  role?: string;
  overlaySettings?: OverlaySettings;
}

export interface EventNodeData {
  eventType: 'earnings' | 'news' | 'filing' | 'split' | 'dividend' | 'macro';
  title: string;
  description?: string;
  timestamp: number;
  symbol?: string;
  source?: string;
  url?: string;
}

export interface NoteNodeData {
  title: string;
  text: string;
  color?: string;
  citations?: Citation[];
}

export interface CalloutNodeData {
  title: string;
  text: string;
  alertType: 'anomaly' | 'gap' | 'spike' | 'correlation';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  symbol?: string;
}

export interface Citation {
  type: 'event' | 'price' | 'overlay';
  timestamp: number;
  description: string;
}

export interface Edge {
  id: string;
  boardId: string;
  sourceId: string;
  targetId: string;
  type: 'relation' | 'supply-chain' | 'correlation' | 'custom';
  label?: string;
  color?: string;
}

export interface NodeGroup {
  id: string;
  boardId: string;
  name: string;
  nodeIds: string[];
  color: string;
  collapsed: boolean;
  position?: { x: number; y: number };
}

// ===== TIMESERIES TYPES =====

export type CandleResolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';

export interface TimeseriesBar {
  symbol: string;
  resolution: CandleResolution;
  timestamp: number;  // Unix epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ===== OVERLAY TYPES =====

export interface OverlaySettings {
  enabledOverlays: string[];
  overlayConfigs: Record<string, OverlayConfig>;
}

export interface OverlayConfig {
  id: string;
  enabled: boolean;
  inputs: Record<string, unknown>;
}

export interface OverlayCacheEntry {
  symbol: string;
  overlayId: string;
  resolution: CandleResolution;
  windowStart: number;
  windowEnd: number;
  data: unknown;
  computedAt: number;
  version: number;
}

// ===== AGENT TYPES =====

export type AgentType = 'ingestion' | 'enrichment' | 'overlay-compute' | 'anomaly' | 'narrative' | 'curator';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentRun {
  id: string;
  agentType: AgentType;
  status: AgentStatus;
  startedAt: number;
  completedAt?: number;
  error?: string;
  artifacts?: AgentArtifact[];
  trace?: AgentTraceEntry[];
}

export interface AgentArtifact {
  type: 'node' | 'edge' | 'overlay' | 'alert';
  id: string;
  data: unknown;
}

export interface AgentTraceEntry {
  timestamp: number;
  action: string;
  details?: unknown;
}

// ===== CANVAS EVENT TYPES =====

export interface CanvasEvent {
  id: string;
  symbol?: string;
  timestamp: number;
  type: EventNodeData['eventType'];
  title: string;
  description?: string;
  source?: string;
  url?: string;
  processed: boolean;
}
