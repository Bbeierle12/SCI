
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
