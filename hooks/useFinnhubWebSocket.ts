import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock, FinnhubTrade, FinnhubWsState } from '../types';

// Type for the Finnhub WebSocket API exposed via preload
interface FinnhubWsAPI {
  wsConnect: () => Promise<{ success: boolean }>;
  wsDisconnect: () => Promise<{ success: boolean }>;
  wsSubscribe: (symbols: string | string[]) => Promise<{ success: boolean; subscribed: string[] }>;
  wsUnsubscribe: (symbols: string | string[]) => Promise<{ success: boolean; subscribed: string[] }>;
  wsGetState: () => Promise<{ state: string; subscribed: string[] }>;
  onWsState: (callback: (data: { state: string; error?: string }) => void) => () => void;
  onTrades: (callback: (trades: FinnhubTrade[]) => void) => () => void;
}

// Access the finnhub API from window.electron
const getFinnhubAPI = (): FinnhubWsAPI | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).electron?.finnhub || null;
};

interface UseFinnhubWebSocketOptions {
  stocks: Stock[];
  enabled?: boolean;
  onPriceUpdate?: (ticker: string, price: number, volume?: number) => void;
  onError?: (error: string) => void;
  maxTicksPerSymbol?: number;
}

interface UseFinnhubWebSocketReturn {
  wsState: FinnhubWsState;
  ticksBySymbol: Record<string, FinnhubTrade[]>;
  latestPrices: Record<string, number>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (symbols: string[]) => Promise<void>;
  unsubscribe: (symbols: string[]) => Promise<void>;
}

export function useFinnhubWebSocket(options: UseFinnhubWebSocketOptions): UseFinnhubWebSocketReturn {
  const {
    stocks,
    enabled = true,
    onPriceUpdate,
    onError,
    maxTicksPerSymbol = 500
  } = options;

  const [wsState, setWsState] = useState<FinnhubWsState>({
    connected: false,
    connecting: false,
    error: null,
    subscribedSymbols: []
  });

  const [ticksBySymbol, setTicksBySymbol] = useState<Record<string, FinnhubTrade[]>>({});
  const [latestPrices, setLatestPrices] = useState<Record<string, number>>({});

  const cleanupRef = useRef<(() => void)[]>([]);
  const subscribedRef = useRef<Set<string>>(new Set());

  // Connect to WebSocket
  const connect = useCallback(async () => {
    const api = getFinnhubAPI();
    if (!api) {
      onError?.('Finnhub API not available');
      return;
    }

    setWsState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      await api.wsConnect();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to connect';
      setWsState(prev => ({ ...prev, connecting: false, error: msg }));
      onError?.(msg);
    }
  }, [onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(async () => {
    const api = getFinnhubAPI();
    if (!api) return;

    try {
      await api.wsDisconnect();
      subscribedRef.current.clear();
      setWsState({
        connected: false,
        connecting: false,
        error: null,
        subscribedSymbols: []
      });
    } catch (error) {
      // Ignore disconnect errors
    }
  }, []);

  // Subscribe to symbols
  const subscribe = useCallback(async (symbols: string[]) => {
    const api = getFinnhubAPI();
    if (!api) return;

    const newSymbols = symbols.filter(s => !subscribedRef.current.has(s.toUpperCase()));
    if (newSymbols.length === 0) return;

    try {
      const result = await api.wsSubscribe(newSymbols);
      if (result.success) {
        newSymbols.forEach(s => subscribedRef.current.add(s.toUpperCase()));
        setWsState(prev => ({
          ...prev,
          subscribedSymbols: Array.from(subscribedRef.current)
        }));
      }
    } catch (error) {
      onError?.(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onError]);

  // Unsubscribe from symbols
  const unsubscribe = useCallback(async (symbols: string[]) => {
    const api = getFinnhubAPI();
    if (!api) return;

    try {
      const result = await api.wsUnsubscribe(symbols);
      if (result.success) {
        symbols.forEach(s => subscribedRef.current.delete(s.toUpperCase()));
        setWsState(prev => ({
          ...prev,
          subscribedSymbols: Array.from(subscribedRef.current)
        }));
      }
    } catch (error) {
      // Ignore unsubscribe errors
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const api = getFinnhubAPI();
    if (!api) return;

    // Listen for WebSocket state changes
    const unsubWsState = api.onWsState((data) => {
      setWsState(prev => ({
        ...prev,
        connected: data.state === 'connected',
        connecting: data.state === 'connecting',
        error: data.error || null
      }));

      if (data.error) {
        onError?.(data.error);
      }
    });

    // Listen for trade data
    const unsubTrades = api.onTrades((trades) => {
      // Group trades by symbol
      const tradesBySymbol: Record<string, FinnhubTrade[]> = {};
      const priceUpdates: Record<string, number> = {};

      for (const trade of trades) {
        const symbol = trade.s.toUpperCase();
        if (!tradesBySymbol[symbol]) {
          tradesBySymbol[symbol] = [];
        }
        tradesBySymbol[symbol].push(trade);
        priceUpdates[symbol] = trade.p;
      }

      // Update ticks storage
      setTicksBySymbol(prev => {
        const next = { ...prev };
        for (const [symbol, newTrades] of Object.entries(tradesBySymbol)) {
          const existing = next[symbol] || [];
          const combined = [...existing, ...newTrades];
          // Keep only the most recent ticks
          next[symbol] = combined.slice(-maxTicksPerSymbol);
        }
        return next;
      });

      // Update latest prices
      setLatestPrices(prev => ({
        ...prev,
        ...priceUpdates
      }));

      // Call price update callback for each symbol
      if (onPriceUpdate) {
        for (const [symbol, price] of Object.entries(priceUpdates)) {
          const lastTrade = tradesBySymbol[symbol]?.[tradesBySymbol[symbol].length - 1];
          onPriceUpdate(symbol, price, lastTrade?.v);
        }
      }
    });

    cleanupRef.current = [unsubWsState, unsubTrades];

    return () => {
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
    };
  }, [onPriceUpdate, onError, maxTicksPerSymbol]);

  // Auto-connect and subscribe when enabled and stocks change
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    const api = getFinnhubAPI();
    if (!api) return;

    const tickers = stocks.map(s => s.ticker.toUpperCase());

    // Connect if not connected
    const initConnection = async () => {
      const state = await api.wsGetState();
      
      if (state.state !== 'connected') {
        await connect();
        // Wait a bit for connection to establish
        await new Promise(r => setTimeout(r, 1000));
      }

      // Subscribe to new symbols
      const currentSymbols = new Set(state.subscribed || []);
      const newSymbols = tickers.filter(t => !currentSymbols.has(t));
      
      if (newSymbols.length > 0) {
        await subscribe(newSymbols);
      }

      // Unsubscribe from removed symbols
      const removedSymbols = Array.from(currentSymbols).filter(s => !tickers.includes(s));
      if (removedSymbols.length > 0) {
        await unsubscribe(removedSymbols);
      }
    };

    initConnection();
  }, [enabled, stocks, connect, disconnect, subscribe, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    wsState,
    ticksBySymbol,
    latestPrices,
    connect,
    disconnect,
    subscribe,
    unsubscribe
  };
}
