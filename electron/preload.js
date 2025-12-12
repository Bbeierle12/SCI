const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Platform information
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },

  // Claude CLI integration
  claude: {
    // Send a prompt to Claude CLI and get response
    query: (prompt, options = {}) => ipcRenderer.invoke('claude:query', prompt, options),
    // Check if Claude CLI is available
    isAvailable: () => ipcRenderer.invoke('claude:isAvailable'),
  },

  // Finnhub API integration
  finnhub: {
    // Get real-time quote for a ticker
    getQuote: (ticker) => ipcRenderer.invoke('finnhub:quote', ticker),
    // Get company profile
    getProfile: (ticker) => ipcRenderer.invoke('finnhub:profile', ticker),
    // Get company news (optional date range)
    getNews: (ticker, from, to) => ipcRenderer.invoke('finnhub:news', ticker, from, to),
    // Get financial metrics
    getMetrics: (ticker) => ipcRenderer.invoke('finnhub:metrics', ticker),
    // Get quotes for multiple tickers
    batchQuotes: (tickers) => ipcRenderer.invoke('finnhub:batchQuotes', tickers),
    // Check if Finnhub API is configured
    isAvailable: () => ipcRenderer.invoke('finnhub:isAvailable'),

    // WebSocket methods
    wsConnect: () => ipcRenderer.invoke('finnhub:wsConnect'),
    wsDisconnect: () => ipcRenderer.invoke('finnhub:wsDisconnect'),
    wsSubscribe: (symbols) => ipcRenderer.invoke('finnhub:wsSubscribe', symbols),
    wsUnsubscribe: (symbols) => ipcRenderer.invoke('finnhub:wsUnsubscribe', symbols),
    wsGetState: () => ipcRenderer.invoke('finnhub:wsGetState'),
    
    // WebSocket event listeners
    onWsState: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on('finnhub:wsState', handler);
      return () => ipcRenderer.removeListener('finnhub:wsState', handler);
    },
    onTrades: (callback) => {
      const handler = (event, trades) => callback(trades);
      ipcRenderer.on('finnhub:trades', handler);
      return () => ipcRenderer.removeListener('finnhub:trades', handler);
    },
  },

  // App configuration
  config: {
    // Get masked Finnhub API key status
    getFinnhubKey: () => ipcRenderer.invoke('config:getFinnhubKey'),
    // Set Finnhub API key
    setFinnhubKey: (apiKey) => ipcRenderer.invoke('config:setFinnhubKey', apiKey),
    // Clear Finnhub API key
    clearFinnhubKey: () => ipcRenderer.invoke('config:clearFinnhubKey'),
  }
});

console.log('Preload script loaded successfully');
