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

  // Add any IPC communication methods here if needed in the future
  // Example:
  // send: (channel, data) => {
  //   // Whitelist channels
  //   const validChannels = ['toMain'];
  //   if (validChannels.includes(channel)) {
  //     ipcRenderer.send(channel, data);
  //   }
  // },
  // receive: (channel, func) => {
  //   const validChannels = ['fromMain'];
  //   if (validChannels.includes(channel)) {
  //     ipcRenderer.on(channel, (event, ...args) => func(...args));
  //   }
  // }
});

// Expose environment variables (for API keys, etc.)
contextBridge.exposeInMainWorld('env', {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
});

console.log('Preload script loaded successfully');
