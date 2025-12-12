const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');

// Load environment variables
require('dotenv').config();

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration();

let mainWindow;
let claudeAvailable = null;

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

// Initialize API key from environment
function initFinnhubApiKey() {
  finnhubApiKey = process.env.FINNHUB_API_KEY;
  if (!finnhubApiKey || finnhubApiKey === 'your_finnhub_api_key_here') {
    console.warn('FINNHUB_API_KEY not configured');
    return false;
  }
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
