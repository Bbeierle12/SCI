const https = require('https');
const { getFinnhubApiKey } = require('./configService');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_RATE_LIMIT = 60; // calls per minute
const CACHE_TTL = 30000; // 30 seconds

let apiCallTimestamps = [];
const finnhubCache = new Map();
let finnhubKeyWarningShown = false;

// Get current API key
function getApiKey() {
  const key = getFinnhubApiKey();
  if (!key || key === 'your_finnhub_api_key_here') {
    if (!finnhubKeyWarningShown) {
      console.warn('FINNHUB_API_KEY not configured');
      finnhubKeyWarningShown = true;
    }
    return null;
  }
  finnhubKeyWarningShown = false;
  return key;
}

// Check if Finnhub is available (has API key)
function isAvailable() {
  return getApiKey() !== null;
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

// Clear cache (called when API key changes)
function clearCache() {
  finnhubCache.clear();
}

// HTTP request wrapper
function finnhubRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error('Finnhub API key not configured. Please set it in Settings.'));
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

    const queryParams = new URLSearchParams({ ...params, token: apiKey });
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

// API functions
async function getQuote(ticker) {
  const result = await finnhubRequest('/quote', { symbol: ticker.toUpperCase() });
  return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
}

async function getProfile(ticker) {
  const result = await finnhubRequest('/stock/profile2', { symbol: ticker.toUpperCase() });
  return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
}

async function getNews(ticker, from, to) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const result = await finnhubRequest('/company-news', {
    symbol: ticker.toUpperCase(),
    from: from || weekAgo,
    to: to || today
  });
  return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
}

async function getMetrics(ticker) {
  const result = await finnhubRequest('/stock/metric', {
    symbol: ticker.toUpperCase(),
    metric: 'all'
  });
  return { success: true, data: result.data, cached: result.cached, timestamp: Date.now() };
}

async function getBatchQuotes(tickers) {
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
}

async function getCandles(symbol, resolution, from, to) {
  // Validate resolution
  const validResolutions = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];
  if (!validResolutions.includes(resolution)) {
    throw new Error(`Invalid resolution. Must be one of: ${validResolutions.join(', ')}`);
  }

  // Validate timestamps
  const fromTimestamp = parseInt(from);
  const toTimestamp = parseInt(to);
  if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
    throw new Error('Invalid timestamps. Must be valid Unix timestamps.');
  }

  if (fromTimestamp >= toTimestamp) {
    throw new Error('From timestamp must be before to timestamp.');
  }

  const result = await finnhubRequest('/stock/candle', {
    symbol: symbol.toUpperCase(),
    resolution,
    from: fromTimestamp.toString(),
    to: toTimestamp.toString()
  });

  // Transform response from arrays to array of objects
  const rawData = result.data;

  // Check if data is available (status 'ok' or 'no_data')
  if (rawData.s === 'no_data' || !rawData.t || rawData.t.length === 0) {
    return { success: true, data: [], cached: result.cached, timestamp: Date.now() };
  }

  const candles = rawData.t.map((timestamp, index) => ({
    timestamp,
    open: rawData.o[index],
    high: rawData.h[index],
    low: rawData.l[index],
    close: rawData.c[index],
    volume: rawData.v[index]
  }));

  return { success: true, data: candles, cached: result.cached, timestamp: Date.now() };
}

module.exports = {
  isAvailable,
  getQuote,
  getProfile,
  getNews,
  getMetrics,
  getBatchQuotes,
  getCandles,
  clearCache,
  getApiKey
};
