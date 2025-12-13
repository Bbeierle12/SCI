import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock, FinnhubTrade, FinnhubWsState } from '../types';
import { WS_URL } from '../services/apiClient';

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
  connect: () => void;
  disconnect: () => void;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}

interface WsMessage {
  type: 'state' | 'trades' | 'subscribed';
  state?: string;
  error?: string;
  data?: FinnhubTrade[];
  symbols?: string[];
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

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSubscriptionsRef = useRef<string[]>([]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: WsMessage = JSON.parse(event.data);

      if (msg.type === 'state') {
        setWsState(prev => ({
          ...prev,
          connected: msg.state === 'connected',
          connecting: msg.state === 'connecting',
          error: msg.error || null
        }));

        if (msg.error) {
          onError?.(msg.error);
        }
      } else if (msg.type === 'trades' && Array.isArray(msg.data)) {
        // Group trades by symbol
        const tradesBySymbol: Record<string, FinnhubTrade[]> = {};
        const priceUpdates: Record<string, number> = {};

        for (const trade of msg.data) {
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
      } else if (msg.type === 'subscribed' && Array.isArray(msg.symbols)) {
        msg.symbols.forEach(s => subscribedRef.current.add(s.toUpperCase()));
        setWsState(prev => ({
          ...prev,
          subscribedSymbols: Array.from(subscribedRef.current)
        }));
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [onPriceUpdate, onError, maxTicksPerSymbol]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setWsState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setWsState(prev => ({ ...prev, connected: true, connecting: false }));

        // Send any pending subscriptions
        if (pendingSubscriptionsRef.current.length > 0) {
          ws.send(JSON.stringify({ type: 'subscribe', symbols: pendingSubscriptionsRef.current }));
          pendingSubscriptionsRef.current = [];
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        setWsState(prev => ({ ...prev, connecting: false, error: 'WebSocket error' }));
        onError?.('WebSocket connection error');
      };

      ws.onclose = () => {
        setWsState(prev => ({ ...prev, connected: false, connecting: false }));
        wsRef.current = null;

        // Auto-reconnect after 5 seconds if we have subscribers
        if (subscribedRef.current.size > 0 && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting WebSocket reconnect...');
            connect();
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to connect';
      setWsState(prev => ({ ...prev, connecting: false, error: msg }));
      onError?.(msg);
    }
  }, [handleMessage, onError, enabled]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    subscribedRef.current.clear();
    setWsState({
      connected: false,
      connecting: false,
      error: null,
      subscribedSymbols: []
    });
  }, []);

  // Subscribe to symbols
  const subscribe = useCallback((symbols: string[]) => {
    const newSymbols = symbols.filter(s => !subscribedRef.current.has(s.toUpperCase()));
    if (newSymbols.length === 0) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbols: newSymbols }));
      newSymbols.forEach(s => subscribedRef.current.add(s.toUpperCase()));
      setWsState(prev => ({
        ...prev,
        subscribedSymbols: Array.from(subscribedRef.current)
      }));
    } else {
      // Queue subscriptions for when connection opens
      pendingSubscriptionsRef.current = [...pendingSubscriptionsRef.current, ...newSymbols];
    }
  }, []);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbols: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbols }));
    }
    symbols.forEach(s => subscribedRef.current.delete(s.toUpperCase()));
    setWsState(prev => ({
      ...prev,
      subscribedSymbols: Array.from(subscribedRef.current)
    }));
  }, []);

  // Auto-connect and subscribe when enabled and stocks change
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    const tickers = stocks.map(s => s.ticker.toUpperCase());

    // Connect if not connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      pendingSubscriptionsRef.current = tickers;
      connect();
    } else {
      // Subscribe to new symbols
      const newSymbols = tickers.filter(t => !subscribedRef.current.has(t));
      if (newSymbols.length > 0) {
        subscribe(newSymbols);
      }

      // Unsubscribe from removed symbols
      const removedSymbols = Array.from(subscribedRef.current).filter(s => !tickers.includes(s));
      if (removedSymbols.length > 0) {
        unsubscribe(removedSymbols);
      }
    }
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
