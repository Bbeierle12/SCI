import { db } from './schema';
import type { TimeseriesCandle, Resolution, OverlayCache } from './schema';

/**
 * Timeseries Data Operations
 */

/**
 * Store candle data for a symbol
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @param candles - Array of candle data
 * @returns Number of candles stored
 */
export async function storeCandles(
  symbol: string,
  resolution: Resolution,
  candles: Omit<TimeseriesCandle, 'symbol' | 'resolution'>[]
): Promise<number> {
  const candlesWithKeys = candles.map(candle => ({
    ...candle,
    symbol: symbol.toUpperCase(),
    resolution
  }));

  // Use bulkPut to insert or update (upsert behavior)
  await db.timeseries.bulkPut(candlesWithKeys);
  return candlesWithKeys.length;
}

/**
 * Get candle data for a symbol within a time range
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @param from - Start timestamp (epoch milliseconds)
 * @param to - End timestamp (epoch milliseconds)
 * @returns Array of candles sorted by timestamp
 */
export async function getCandles(
  symbol: string,
  resolution: Resolution,
  from: number,
  to: number
): Promise<TimeseriesCandle[]> {
  const upperSymbol = symbol.toUpperCase();

  return await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, from],
      [upperSymbol, resolution, to],
      true, // include lower bound
      true  // include upper bound
    )
    .toArray();
}

/**
 * Get the latest candle for a symbol and resolution
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @returns The most recent candle or undefined if none exist
 */
export async function getLatestCandle(
  symbol: string,
  resolution: Resolution
): Promise<TimeseriesCandle | undefined> {
  const upperSymbol = symbol.toUpperCase();

  const candles = await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .reverse()
    .limit(1)
    .toArray();

  return candles[0];
}

/**
 * Get the available date range for a symbol and resolution
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @returns Object with earliest and latest timestamps, or null if no data
 */
export async function getCandleRange(
  symbol: string,
  resolution: Resolution
): Promise<{ from: number; to: number; count: number } | null> {
  const upperSymbol = symbol.toUpperCase();

  const candles = await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .toArray();

  if (candles.length === 0) return null;

  const timestamps = candles.map(c => c.timestamp);
  return {
    from: Math.min(...timestamps),
    to: Math.max(...timestamps),
    count: candles.length
  };
}

/**
 * Delete candles older than a specific timestamp
 * @param olderThan - Timestamp threshold (epoch milliseconds)
 * @returns Number of candles deleted
 */
export async function clearOldCandles(olderThan: number): Promise<number> {
  return await db.timeseries
    .where('timestamp')
    .below(olderThan)
    .delete();
}

/**
 * Delete all candles for a specific symbol
 * @param symbol - Stock symbol
 * @returns Number of candles deleted
 */
export async function deleteCandlesForSymbol(symbol: string): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  return await db.timeseries
    .where('symbol')
    .equals(upperSymbol)
    .delete();
}

/**
 * Delete candles for a specific symbol and resolution
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @returns Number of candles deleted
 */
export async function deleteCandlesForSymbolResolution(
  symbol: string,
  resolution: Resolution
): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  return await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .delete();
}

/**
 * Get all unique symbols that have timeseries data
 * @returns Array of unique symbol strings
 */
export async function getAllSymbols(): Promise<string[]> {
  const allCandles = await db.timeseries.toArray();
  const symbolSet = new Set(allCandles.map(c => c.symbol));
  return Array.from(symbolSet).sort();
}

/**
 * Get all resolutions available for a symbol
 * @param symbol - Stock symbol
 * @returns Array of available resolutions
 */
export async function getAvailableResolutions(symbol: string): Promise<Resolution[]> {
  const upperSymbol = symbol.toUpperCase();

  const candles = await db.timeseries
    .where('symbol')
    .equals(upperSymbol)
    .toArray();

  const resolutionSet = new Set(candles.map(c => c.resolution));
  return Array.from(resolutionSet);
}

/**
 * Get timeseries statistics for a symbol and resolution
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @returns Statistics object or null if no data
 */
export async function getCandleStats(
  symbol: string,
  resolution: Resolution
): Promise<{
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  highestPrice: number;
  lowestPrice: number;
  averageVolume: number;
} | null> {
  const upperSymbol = symbol.toUpperCase();

  const candles = await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .toArray();

  if (candles.length === 0) return null;

  const timestamps = candles.map(c => c.timestamp);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  return {
    count: candles.length,
    firstTimestamp: Math.min(...timestamps),
    lastTimestamp: Math.max(...timestamps),
    highestPrice: Math.max(...highs),
    lowestPrice: Math.min(...lows),
    averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length
  };
}

/**
 * Overlay Cache Operations
 */

/**
 * Store computed overlay data
 * @param cache - Overlay cache data
 * @returns The stored cache entry
 */
export async function storeOverlayCache(
  cache: Omit<OverlayCache, 'computedAt'>
): Promise<OverlayCache> {
  const cacheWithTimestamp: OverlayCache = {
    ...cache,
    symbol: cache.symbol.toUpperCase(),
    computedAt: Date.now()
  };

  await db.overlayCache.put(cacheWithTimestamp);
  return cacheWithTimestamp;
}

/**
 * Get overlay cache data
 * @param symbol - Stock symbol
 * @param overlayId - Overlay identifier
 * @param resolution - Timeframe resolution
 * @param windowStart - Window start timestamp
 * @returns Cached overlay data or undefined if not found
 */
export async function getOverlayCache(
  symbol: string,
  overlayId: string,
  resolution: Resolution,
  windowStart: number
): Promise<OverlayCache | undefined> {
  const upperSymbol = symbol.toUpperCase();

  return await db.overlayCache.get([
    upperSymbol,
    overlayId,
    resolution,
    windowStart
  ]);
}

/**
 * Get all overlay caches for a symbol
 * @param symbol - Stock symbol
 * @returns Array of cached overlays
 */
export async function getOverlayCachesForSymbol(symbol: string): Promise<OverlayCache[]> {
  const upperSymbol = symbol.toUpperCase();

  return await db.overlayCache
    .where('symbol')
    .equals(upperSymbol)
    .toArray();
}

/**
 * Delete overlay cache entries older than a specific timestamp
 * @param olderThan - Timestamp threshold (epoch milliseconds)
 * @returns Number of cache entries deleted
 */
export async function clearOldOverlayCache(olderThan: number): Promise<number> {
  return await db.overlayCache
    .where('computedAt')
    .below(olderThan)
    .delete();
}

/**
 * Delete all overlay cache entries for a symbol
 * @param symbol - Stock symbol
 * @returns Number of cache entries deleted
 */
export async function deleteOverlayCacheForSymbol(symbol: string): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  return await db.overlayCache
    .where('symbol')
    .equals(upperSymbol)
    .delete();
}

/**
 * Delete a specific overlay cache entry
 * @param symbol - Stock symbol
 * @param overlayId - Overlay identifier
 * @param resolution - Timeframe resolution
 * @param windowStart - Window start timestamp
 * @returns Number of entries deleted (0 or 1)
 */
export async function deleteOverlayCache(
  symbol: string,
  overlayId: string,
  resolution: Resolution,
  windowStart: number
): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  const deleted = await db.overlayCache.delete([
    upperSymbol,
    overlayId,
    resolution,
    windowStart
  ]);

  return deleted ? 1 : 0;
}

/**
 * Utility Functions
 */

/**
 * Check if candles exist for a symbol and resolution in a time range
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @param from - Start timestamp
 * @param to - End timestamp
 * @returns True if data exists, false otherwise
 */
export async function hasCandlesInRange(
  symbol: string,
  resolution: Resolution,
  from: number,
  to: number
): Promise<boolean> {
  const upperSymbol = symbol.toUpperCase();

  const count = await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, from],
      [upperSymbol, resolution, to],
      true,
      true
    )
    .count();

  return count > 0;
}

/**
 * Get database size information
 * @returns Object with counts for each table
 */
export async function getTimeseriesStats(): Promise<{
  totalCandles: number;
  totalOverlays: number;
  uniqueSymbols: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  const [candles, overlays] = await Promise.all([
    db.timeseries.toArray(),
    db.overlayCache.count()
  ]);

  const symbolSet = new Set(candles.map(c => c.symbol));
  const timestamps = candles.map(c => c.timestamp);

  return {
    totalCandles: candles.length,
    totalOverlays: overlays,
    uniqueSymbols: symbolSet.size,
    oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null
  };
}

/**
 * Clear all timeseries data
 * WARNING: This will delete all candle and overlay cache data
 * @returns Object with counts of deleted items
 */
export async function clearAllTimeseriesData(): Promise<{
  candles: number;
  overlays: number;
}> {
  return await db.transaction('rw', [db.timeseries, db.overlayCache], async () => {
    const candlesDeleted = await db.timeseries.clear();
    const overlaysDeleted = await db.overlayCache.clear();

    return {
      candles: candlesDeleted,
      overlays: overlaysDeleted
    };
  });
}

/**
 * Bulk import candles from external source
 * @param data - Array of candles with symbol and resolution
 * @returns Number of candles imported
 */
export async function bulkImportCandles(
  data: TimeseriesCandle[]
): Promise<number> {
  const candlesWithUpperSymbol = data.map(candle => ({
    ...candle,
    symbol: candle.symbol.toUpperCase()
  }));

  await db.timeseries.bulkPut(candlesWithUpperSymbol);
  return candlesWithUpperSymbol.length;
}

/**
 * Get candles with pagination
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @param offset - Number of records to skip
 * @param limit - Maximum number of records to return
 * @returns Array of candles
 */
export async function getCandlesPaginated(
  symbol: string,
  resolution: Resolution,
  offset: number,
  limit: number
): Promise<TimeseriesCandle[]> {
  const upperSymbol = symbol.toUpperCase();

  return await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .offset(offset)
    .limit(limit)
    .toArray();
}

/**
 * Find gaps in timeseries data
 * @param symbol - Stock symbol
 * @param resolution - Timeframe resolution
 * @param expectedInterval - Expected interval between candles in milliseconds
 * @returns Array of gap ranges
 */
export async function findDataGaps(
  symbol: string,
  resolution: Resolution,
  expectedInterval: number
): Promise<Array<{ from: number; to: number }>> {
  const upperSymbol = symbol.toUpperCase();

  const candles = await db.timeseries
    .where('[symbol+resolution+timestamp]')
    .between(
      [upperSymbol, resolution, 0],
      [upperSymbol, resolution, Number.MAX_SAFE_INTEGER]
    )
    .sortBy('timestamp');

  const gaps: Array<{ from: number; to: number }> = [];

  for (let i = 1; i < candles.length; i++) {
    const timeDiff = candles[i].timestamp - candles[i - 1].timestamp;
    if (timeDiff > expectedInterval * 1.5) {
      gaps.push({
        from: candles[i - 1].timestamp,
        to: candles[i].timestamp
      });
    }
  }

  return gaps;
}
