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
  }
});

console.log('Preload script loaded successfully');
