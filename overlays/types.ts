import { TimeseriesBar, CandleResolution, Viewport } from '../types';

/**
 * Base overlay plugin interface
 * All overlays must implement this interface
 */
export interface Overlay<TInput = unknown, TOutput = unknown> {
  /** Unique identifier for the overlay */
  id: string;

  /** Display name */
  name: string;

  /** Category for grouping in UI */
  category: 'price' | 'momentum' | 'volume' | 'volatility' | 'event' | 'custom';

  /** Default input configuration */
  defaultInputs: TInput;

  /** Compute overlay data from bars */
  compute(bars: TimeseriesBar[], inputs: TInput): TOutput[];

  /** Generate cache key for this computation */
  cacheKey(symbol: string, resolution: CandleResolution, inputs: TInput): string;

  /** Events that invalidate cached data */
  invalidateOn: InvalidationTrigger[];

  /** Z-index for rendering order (higher = on top) */
  zIndex: number;

  /** Level of detail configuration */
  lodConfig: LODConfig;

  /** Whether this overlay needs a separate pane (e.g., RSI) */
  separatePane: boolean;

  /** Render overlay on canvas - called by lightweight-charts or custom renderer */
  render?: (
    ctx: CanvasRenderingContext2D,
    data: TOutput[],
    viewport: Viewport,
    options: RenderOptions
  ) => void;
}

export type InvalidationTrigger = 'newBar' | 'inputChange' | 'manual' | 'resolution';

export interface LODConfig {
  /** Minimum zoom level to show this overlay */
  minZoom: number;
  /** Maximum zoom level to show this overlay */
  maxZoom: number;
  /** Resolutions where this overlay is available */
  availableResolutions: CandleResolution[];
}

export interface RenderOptions {
  width: number;
  height: number;
  priceRange: { min: number; max: number };
  timeRange: { from: number; to: number };
  colors: OverlayColors;
}

export interface OverlayColors {
  primary: string;
  secondary: string;
  positive: string;
  negative: string;
  neutral: string;
}

// ===== SPECIFIC OVERLAY TYPES =====

/** Moving Average inputs */
export interface MAInputs {
  period: number;
  type: 'SMA' | 'EMA' | 'WMA';
  source: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  color: string;
  lineWidth: number;
}

/** Moving Average output */
export interface MAOutput {
  timestamp: number;
  value: number | null;
}

/** Volume overlay inputs */
export interface VolumeInputs {
  colorUp: string;
  colorDown: string;
  opacity: number;
}

/** Volume output */
export interface VolumeOutput {
  timestamp: number;
  volume: number;
  color: string;
}

/** RSI inputs */
export interface RSIInputs {
  period: number;
  overbought: number;
  oversold: number;
  color: string;
}

/** RSI output */
export interface RSIOutput {
  timestamp: number;
  value: number | null;
}

/** MACD inputs */
export interface MACDInputs {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  macdColor: string;
  signalColor: string;
  histogramColorUp: string;
  histogramColorDown: string;
}

/** MACD output */
export interface MACDOutput {
  timestamp: number;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

/** Bollinger Bands inputs */
export interface BollingerInputs {
  period: number;
  stdDev: number;
  source: 'close' | 'hl2';
  upperColor: string;
  middleColor: string;
  lowerColor: string;
  fillColor: string;
  fillOpacity: number;
}

/** Bollinger Bands output */
export interface BollingerOutput {
  timestamp: number;
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

/** Event marker inputs */
export interface EventMarkerInputs {
  showEarnings: boolean;
  showNews: boolean;
  showFilings: boolean;
  showSplits: boolean;
  showDividends: boolean;
  showMacro: boolean;
}

/** Event marker output */
export interface EventMarkerOutput {
  timestamp: number;
  type: string;
  title: string;
  description?: string;
  color: string;
}

// ===== OVERLAY REGISTRY =====

export interface OverlayRegistryEntry {
  id: string;
  name: string;
  category: Overlay['category'];
  factory: () => Overlay;
}

export type OverlayRegistry = Map<string, OverlayRegistryEntry>;

// ===== OVERLAY COMPUTATION MESSAGES (for Web Worker) =====

export interface OverlayComputeRequest {
  type: 'compute';
  requestId: string;
  overlayId: string;
  symbol: string;
  resolution: CandleResolution;
  bars: TimeseriesBar[];
  inputs: unknown;
}

export interface OverlayComputeResponse {
  type: 'result';
  requestId: string;
  overlayId: string;
  symbol: string;
  resolution: CandleResolution;
  data: unknown[];
  computeTimeMs: number;
}

export interface OverlayComputeError {
  type: 'error';
  requestId: string;
  overlayId: string;
  error: string;
}

export type OverlayWorkerMessage = OverlayComputeRequest;
export type OverlayWorkerResponse = OverlayComputeResponse | OverlayComputeError;
