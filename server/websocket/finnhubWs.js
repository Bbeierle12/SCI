const WebSocket = require('ws');
const { getApiKey } = require('../services/finnhubService');

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

let finnhubWs = null;
let wsReconnectTimer = null;
let wsSubscribedSymbols = new Set();
let wsConnectionState = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'

// Track connected clients
const clients = new Set();

function broadcastToClients(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function connectFinnhubWebSocket() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Cannot connect WebSocket: Finnhub API key not configured');
    broadcastToClients({ type: 'state', state: 'error', error: 'API key not configured' });
    return;
  }

  if (finnhubWs && (finnhubWs.readyState === WebSocket.OPEN || finnhubWs.readyState === WebSocket.CONNECTING)) {
    return; // Already connected or connecting
  }

  wsConnectionState = 'connecting';
  broadcastToClients({ type: 'state', state: 'connecting' });

  try {
    finnhubWs = new WebSocket(`${FINNHUB_WS_URL}?token=${apiKey}`);

    finnhubWs.on('open', () => {
      console.log('Finnhub WebSocket connected');
      wsConnectionState = 'connected';
      broadcastToClients({ type: 'state', state: 'connected' });

      // Resubscribe to all previously subscribed symbols
      for (const symbol of wsSubscribedSymbols) {
        finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    });

    finnhubWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'error') {
          console.error('Finnhub WS error:', msg.msg);
          broadcastToClients({ type: 'state', state: 'error', error: msg.msg });
          return;
        }

        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          // Forward trade data to all connected clients
          broadcastToClients({ type: 'trades', data: msg.data });
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    finnhubWs.on('error', (error) => {
      console.error('Finnhub WebSocket error:', error.message);
      wsConnectionState = 'disconnected';
      broadcastToClients({ type: 'state', state: 'error', error: error.message });
    });

    finnhubWs.on('close', () => {
      console.log('Finnhub WebSocket closed');
      wsConnectionState = 'disconnected';
      broadcastToClients({ type: 'state', state: 'disconnected' });
      finnhubWs = null;

      // Auto-reconnect after 5 seconds if we have subscribers
      if (wsSubscribedSymbols.size > 0 && clients.size > 0) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = setTimeout(() => {
          console.log('Attempting WebSocket reconnect...');
          connectFinnhubWebSocket();
        }, 5000);
      }
    });
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    wsConnectionState = 'disconnected';
    broadcastToClients({ type: 'state', state: 'error', error: error.message });
  }
}

function disconnectFinnhubWebSocket() {
  clearTimeout(wsReconnectTimer);
  wsSubscribedSymbols.clear();

  if (finnhubWs) {
    try {
      finnhubWs.close();
    } catch (e) {
      // Ignore
    }
    finnhubWs = null;
  }
  wsConnectionState = 'disconnected';
}

function subscribe(symbols) {
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];

  for (const symbol of symbolList) {
    const s = symbol.toUpperCase();
    wsSubscribedSymbols.add(s);

    if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
      finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: s }));
    }
  }

  // Connect if not already connected
  if (!finnhubWs || finnhubWs.readyState !== WebSocket.OPEN) {
    connectFinnhubWebSocket();
  }

  return Array.from(wsSubscribedSymbols);
}

function unsubscribe(symbols) {
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];

  for (const symbol of symbolList) {
    const s = symbol.toUpperCase();
    wsSubscribedSymbols.delete(s);

    if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
      finnhubWs.send(JSON.stringify({ type: 'unsubscribe', symbol: s }));
    }
  }

  return Array.from(wsSubscribedSymbols);
}

function getState() {
  return {
    state: wsConnectionState,
    subscribed: Array.from(wsSubscribedSymbols)
  };
}

// Setup WebSocket server for client connections
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/finnhub' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);

    // Send current state to new client
    ws.send(JSON.stringify({ type: 'state', state: wsConnectionState }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'subscribe' && msg.symbols) {
          const subscribed = subscribe(msg.symbols);
          ws.send(JSON.stringify({ type: 'subscribed', symbols: subscribed }));
        } else if (msg.type === 'unsubscribe' && msg.symbols) {
          const subscribed = unsubscribe(msg.symbols);
          ws.send(JSON.stringify({ type: 'subscribed', symbols: subscribed }));
        } else if (msg.type === 'getState') {
          ws.send(JSON.stringify({ type: 'state', ...getState() }));
        }
      } catch (e) {
        console.error('Error processing client message:', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clients.delete(ws);

      // If no more clients, disconnect from Finnhub to save resources
      if (clients.size === 0) {
        console.log('No clients connected, disconnecting from Finnhub');
        disconnectFinnhubWebSocket();
      }
    });

    ws.on('error', (error) => {
      console.error('Client WebSocket error:', error.message);
      clients.delete(ws);
    });
  });

  return wss;
}

module.exports = {
  setupWebSocketServer,
  getState
};
