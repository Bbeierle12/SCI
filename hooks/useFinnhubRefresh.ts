import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock, FinnhubQuote, RefreshState } from '../types';
import { getBatchQuotes, isFinnhubAvailable } from '../services/finnhubService';

interface UseFinnhubRefreshOptions {
  stocks: Stock[];
  autoRefreshInterval?: number; // milliseconds, default 60000 (60s)
  enabled?: boolean;
  onUpdate: (updates: Map<string, Partial<Stock>>) => void;
  onError?: (error: string) => void;
}

interface UseFinnhubRefreshReturn {
  state: RefreshState;
  refresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (ms: number) => void;
}

export function useFinnhubRefresh(options: UseFinnhubRefreshOptions): UseFinnhubRefreshReturn {
  const {
    stocks,
    autoRefreshInterval = 60000,
    enabled = true,
    onUpdate,
    onError
  } = options;

  const [state, setState] = useState<RefreshState>({
    isRefreshing: false,
    lastRefresh: null,
    autoRefreshEnabled: enabled,
    intervalMs: autoRefreshInterval,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Refresh function
  const refresh = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) return;

    // Check if Finnhub is available
    const available = await isFinnhubAvailable();
    if (!available) {
      const errorMsg = 'Finnhub API not configured. Please set FINNHUB_API_KEY in .env file.';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }

    isRefreshingRef.current = true;
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));

    try {
      const tickers = stocks.map(s => s.ticker);
      const quotes = await getBatchQuotes(tickers);

      // Build update map
      const updates = new Map<string, Partial<Stock>>();

      for (const stock of stocks) {
        const quote = quotes[stock.ticker];
        if (quote && quote.c > 0) {
          updates.set(stock.ticker, {
            price: quote.c,
            change: quote.dp // Use percent change
          });
        }
      }

      if (updates.size > 0) {
        onUpdate(updates);
      }

      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null
      }));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh stock data';
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: errorMsg
      }));
      onError?.(errorMsg);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [stocks, onUpdate, onError]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoRefreshEnabled: !prev.autoRefreshEnabled
    }));
  }, []);

  // Set refresh interval
  const setRefreshInterval = useCallback((ms: number) => {
    setState(prev => ({
      ...prev,
      intervalMs: Math.max(30000, ms) // Minimum 30 seconds
    }));
  }, []);

  // Setup auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state.autoRefreshEnabled && stocks.length > 0) {
      // Initial refresh
      refresh();

      // Setup interval
      intervalRef.current = setInterval(refresh, state.intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.autoRefreshEnabled, state.intervalMs, stocks.length, refresh]);

  return {
    state,
    refresh,
    toggleAutoRefresh,
    setRefreshInterval
  };
}
