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
  }
});

console.log('Preload script loaded successfully');
