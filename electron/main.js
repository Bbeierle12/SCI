const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const https = require('https');
const WebSocket = require('ws');

// Load environment variables
require('dotenv').config();

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration();

let mainWindow;
let claudeAvailable = null;

// ===== CONFIG FILE MANAGEMENT =====
const CONFIG_FILE = path.join(app.getPath('userData'), 'sci-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return {};
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

// Get API key from config file first, then fall back to env
function getFinnhubApiKey() {
  const config = loadConfig();
  if (config.finnhubApiKey) {
    return config.finnhubApiKey;
  }
  return process.env.FINNHUB_API_KEY;
}

// Check if Claude CLI is available
function checkClaudeAvailable() {
  if (claudeAvailable !== null) return claudeAvailable;
  try {
    execSync('claude --version', { stdio: 'pipe' });
    claudeAvailable = true;
  } catch {
    claudeAvailable = false;
  }
  return claudeAvailable;
}

// Execute Claude CLI command
async function queryClaudeCLI(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    if (!checkClaudeAvailable()) {
      reject(new Error('Claude CLI is not available'));
      return;
    }

    const args = ['-p', '--output-format', 'text'];
    
    // Add system prompt if provided
    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }
    
    // Disable tools for pure text responses (faster)
    if (options.noTools) {
      args.push('--tools', '');
    }
    
    // Add the prompt
    args.push(prompt);

    const claude = spawn('claude', args, {
      shell: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `Claude CLI exited with code ${code}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      claude.kill();
      reject(new Error('Claude CLI timeout'));
    }, 60000);
  });
}

// IPC Handlers for Claude CLI
ipcMain.handle('claude:query', async (event, prompt, options) => {
  try {
    const response = await queryClaudeCLI(prompt, options);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('claude:isAvailable', async () => {
  return checkClaudeAvailable();
});

// ===== FINNHUB API INTEGRATION =====

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_RATE_LIMIT = 60; // calls per minute
const CACHE_TTL = 30000; // 30 seconds

let finnhubApiKey = null;
let apiCallTimestamps = [];
const finnhubCache = new Map();
let finnhubKeyWarningShown = false;

// Initialize API key from config or environment
function initFinnhubApiKey() {
  finnhubApiKey = getFinnhubApiKey();
  if (!finnhubApiKey || finnhubApiKey === 'your_finnhub_api_key_here') {
    if (!finnhubKeyWarningShown) {
      console.warn('FINNHUB_API_KEY not configured');
      finnhubKeyWarningShown = true;
    }
    return false;
  }
  finnhubKeyWarningShown = false; // Reset if key becomes available
  return true;
}

// Rate limiter
function canMakeApiCall() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  apiCallTimestamps = apiCallTimestamps.filter(t => t > oneMinuteAgo);
  return apiCallTimestamps.length < FINNHUB_RATE_LIMIT;
}

function recordApiCall() {
  apiCallTimestamps.push(Date.now());
}

// Cache helpers
function getCached(key) {
  const entry = finnhubCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    finnhubCache.delete(key);
    return null;
  }
  return { data: entry.data, cached: true };
}

function setCache(key, data) {
  finnhubCache.set(key, { data, timestamp: Date.now() });
}

// HTTP request wrapper
function finnhubRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    if (!initFinnhubApiKey()) {
      reject(new Error('Finnhub API key not configured. Please set FINNHUB_API_KEY in .env file.'));
      return;
    }

    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      resolve(cached);
      return;
    }

    if (!canMakeApiCall()) {
      reject(new Error('Rate limit exceeded. Please wait before making more requests.'));
      return;
    }

    const queryParams = new URLSearchParams({ ...params, token: finnhubApiKey });
    const url = `${FINNHUB_BASE_URL}${endpoint}?${queryParams}`;

    recordApiCall();

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            setCache(cacheKey, parsed);
            resolve({ data: parsed, cached: false });
          }
        } catch (e) {
          reject(new Error('Invalid JSON response from Finnhub'));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });
  });
}

// Finnhub IPC Handlers
ipcMain.handle('finnhub:isAvailable', async () => {
  return initFinnhubApiKey();
});

ipcMain.handle('finnhub:quote', async (event, ticker) => {
  try {
    const result = await finnhubRequest('/quote', { symbol: ticker.toUpperCase() });
    return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('finnhub:profile', async (event, ticker) => {
  try {
    const result = await finnhubRequest('/stock/profile2', { symbol: ticker.toUpperCase() });
    return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('finnhub:news', async (event, ticker, from, to) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const result = await finnhubRequest('/company-news', {
      symbol: ticker.toUpperCase(),
      from: from || weekAgo,
      to: to || today
    });
    return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('finnhub:metrics', async (event, ticker) => {
  try {
    const result = await finnhubRequest('/stock/metric', {
      symbol: ticker.toUpperCase(),
      metric: 'all'
    });
    return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('finnhub:batchQuotes', async (event, tickers) => {
  try {
    const results = {};
    const errors = [];

    // Process sequentially to respect rate limits
    for (const ticker of tickers) {
      try {
        const result = await finnhubRequest('/quote', { symbol: ticker.toUpperCase() });
        results[ticker] = result.data;
      } catch (e) {
        errors.push({ ticker, error: e.message });
      }
      // Small delay between requests
      if (tickers.indexOf(ticker) < tickers.length - 1) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    return {
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ===== CONFIG IPC HANDLERS =====

ipcMain.handle('config:getFinnhubKey', async () => {
  const config = loadConfig();
  // Return masked key for display (show last 4 chars only)
  const key = config.finnhubApiKey || '';
  if (key.length > 4) {
    return { hasKey: true, maskedKey: '••••••••' + key.slice(-4) };
  }
  return { hasKey: false, maskedKey: '' };
});

ipcMain.handle('config:setFinnhubKey', async (event, apiKey) => {
  try {
    const config = loadConfig();
    config.finnhubApiKey = apiKey;
    const saved = saveConfig(config);
    if (saved) {
      // Reset the cached key so it gets re-read
      finnhubApiKey = null;
      finnhubCache.clear();
      return { success: true };
    }
    return { success: false, error: 'Failed to save config' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config:clearFinnhubKey', async () => {
  try {
    const config = loadConfig();
    delete config.finnhubApiKey;
    saveConfig(config);
    finnhubApiKey = null;
    finnhubCache.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ===== FINNHUB WEBSOCKET INTEGRATION =====

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
let finnhubWs = null;
let wsReconnectTimer = null;
let wsSubscribedSymbols = new Set();
let wsConnectionState = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'

function connectFinnhubWebSocket() {
  if (!initFinnhubApiKey()) {
    console.warn('Cannot connect WebSocket: Finnhub API key not configured');
    sendWsStateToRenderer('error', 'API key not configured');
    return;
  }

  if (finnhubWs && (finnhubWs.readyState === WebSocket.OPEN || finnhubWs.readyState === WebSocket.CONNECTING)) {
    return; // Already connected or connecting
  }

  wsConnectionState = 'connecting';
  sendWsStateToRenderer('connecting');

  try {
    finnhubWs = new WebSocket(`${FINNHUB_WS_URL}?token=${finnhubApiKey}`);

    finnhubWs.on('open', () => {
      console.log('Finnhub WebSocket connected');
      wsConnectionState = 'connected';
      sendWsStateToRenderer('connected');

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
          sendWsStateToRenderer('error', msg.msg);
          return;
        }

        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          // Forward trade data to renderer
          sendTradeDataToRenderer(msg.data);
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    finnhubWs.on('error', (error) => {
      console.error('Finnhub WebSocket error:', error.message);
      wsConnectionState = 'disconnected';
      sendWsStateToRenderer('error', error.message);
    });

    finnhubWs.on('close', () => {
      console.log('Finnhub WebSocket closed');
      wsConnectionState = 'disconnected';
      sendWsStateToRenderer('disconnected');
      finnhubWs = null;

      // Auto-reconnect after 5 seconds if we have subscribers
      if (wsSubscribedSymbols.size > 0) {
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
    sendWsStateToRenderer('error', error.message);
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

function sendWsStateToRenderer(state, error = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('finnhub:wsState', { state, error });
  }
}

function sendTradeDataToRenderer(trades) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('finnhub:trades', trades);
  }
}

// WebSocket IPC Handlers
ipcMain.handle('finnhub:wsConnect', async () => {
  connectFinnhubWebSocket();
  return { success: true };
});

ipcMain.handle('finnhub:wsDisconnect', async () => {
  disconnectFinnhubWebSocket();
  return { success: true };
});

ipcMain.handle('finnhub:wsSubscribe', async (event, symbols) => {
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

  return { success: true, subscribed: Array.from(wsSubscribedSymbols) };
});

ipcMain.handle('finnhub:wsUnsubscribe', async (event, symbols) => {
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];
  
  for (const symbol of symbolList) {
    const s = symbol.toUpperCase();
    wsSubscribedSymbols.delete(s);
    
    if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
      finnhubWs.send(JSON.stringify({ type: 'unsubscribe', symbol: s }));
    }
  }

  return { success: true, subscribed: Array.from(wsSubscribedSymbols) };
});

ipcMain.handle('finnhub:wsGetState', async () => {
  return {
    state: wsConnectionState,
    subscribed: Array.from(wsSubscribedSymbols)
  };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Apple Supply Chain Intelligence',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    backgroundColor: '#030712', // matches bg-gray-950
    show: false, // Don't show until ready
    autoHideMenuBar: false,
    frame: true
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development mode - load from Vite dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Create custom menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About SCI',
              message: 'Apple Supply Chain Intelligence',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode: ${process.versions.node}`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const { shell } = require('electron');
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow navigation to localhost (dev server) and file protocol
    if (parsedUrl.protocol === 'file:' ||
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1') {
      return;
    }

    // Prevent all other navigation
    event.preventDefault();
  });
});
