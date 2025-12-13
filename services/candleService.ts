import { CandleData, CandleResolution, FinnhubResponse } from '../types';
import { apiGet } from './apiClient';

/**
 * Fetch historical candle data for a symbol
 */
export async function getCandles(
  symbol: string,
  resolution: CandleResolution = 'D',
  from?: number,
  to?: number
): Promise<CandleData[]> {
  try {
    // Default to last 365 days if not specified
    const now = Math.floor(Date.now() / 1000);
    const defaultFrom = now - 365 * 24 * 60 * 60;

    const params = new URLSearchParams({
      resolution,
      from: String(from ?? defaultFrom),
      to: String(to ?? now)
    });

    const response = await apiGet<FinnhubResponse<CandleData[]>>(
      `/api/finnhub/candles/${symbol}?${params.toString()}`
    );

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    console.warn(`No candle data available for ${symbol}:`, response.error);
    return [];
  } catch (error) {
    console.error(`Candle fetch error (${symbol}):`, error);
    return [];
  }
}

/**
 * Get candles for multiple symbols in parallel
 */
export async function getBatchCandles(
  symbols: string[],
  resolution: CandleResolution = 'D',
  from?: number,
  to?: number
): Promise<Record<string, CandleData[]>> {
  const results: Record<string, CandleData[]> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      results[symbol] = await getCandles(symbol, resolution, from, to);
    })
  );

  return results;
}

/**
 * Get resolution in milliseconds for tile calculations
 */
export function getResolutionMs(resolution: CandleResolution): number {
  switch (resolution) {
    case '1': return 60 * 1000;
    case '5': return 5 * 60 * 1000;
    case '15': return 15 * 60 * 1000;
    case '30': return 30 * 60 * 1000;
    case '60': return 60 * 60 * 1000;
    case 'D': return 24 * 60 * 60 * 1000;
    case 'W': return 7 * 24 * 60 * 60 * 1000;
    case 'M': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

/**
 * Get appropriate resolution for a given zoom level
 * LOD: zoom out -> aggregate, zoom in -> finer
 */
export function getResolutionForZoom(zoom: number): CandleResolution {
  if (zoom < 0.2) return 'M';
  if (zoom < 0.4) return 'W';
  if (zoom < 0.7) return 'D';
  if (zoom < 1.5) return '60';
  if (zoom < 3) return '15';
  if (zoom < 5) return '5';
  return '1';
}

/**
 * Calculate tile boundaries for a given time range
 * Tile = 500 bars at current resolution
 */
export function calculateTiles(
  from: number,
  to: number,
  resolution: CandleResolution,
  tileSize: number = 500
): Array<{ from: number; to: number }> {
  const resolutionMs = getResolutionMs(resolution);
  const tileDuration = tileSize * resolutionMs;

  const tiles: Array<{ from: number; to: number }> = [];
  let tileStart = Math.floor(from / tileDuration) * tileDuration;

  while (tileStart < to) {
    tiles.push({
      from: tileStart,
      to: Math.min(tileStart + tileDuration, to)
    });
    tileStart += tileDuration;
  }

  return tiles;
}
