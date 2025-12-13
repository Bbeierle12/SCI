const fs = require('fs');
const path = require('path');
const os = require('os');

// Config file location - use OS-appropriate user data directory
function getConfigDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || os.homedir(), 'sci');
  }
  return path.join(os.homedir(), '.sci');
}

const CONFIG_DIR = getConfigDir();
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  try {
    ensureConfigDir();
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
    ensureConfigDir();
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

// Get masked key for display
function getMaskedFinnhubKey() {
  const config = loadConfig();
  const key = config.finnhubApiKey || '';
  if (key.length > 4) {
    return { hasKey: true, maskedKey: '........' + key.slice(-4) };
  }
  return { hasKey: false, maskedKey: '' };
}

// Set API key
function setFinnhubApiKey(apiKey) {
  const config = loadConfig();
  config.finnhubApiKey = apiKey;
  return saveConfig(config);
}

// Clear API key
function clearFinnhubApiKey() {
  const config = loadConfig();
  delete config.finnhubApiKey;
  return saveConfig(config);
}

module.exports = {
  loadConfig,
  saveConfig,
  getFinnhubApiKey,
  getMaskedFinnhubKey,
  setFinnhubApiKey,
  clearFinnhubApiKey
};
