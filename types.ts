
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
