const express = require('express');
const finnhubService = require('../services/finnhubService');

const router = express.Router();

// GET /api/finnhub/available - Check if Finnhub API is available
router.get('/available', (req, res) => {
  try {
    const available = finnhubService.isAvailable();
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/finnhub/quote/:ticker - Get quote for a ticker
router.get('/quote/:ticker', async (req, res) => {
  try {
    const result = await finnhubService.getQuote(req.params.ticker);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finnhub/profile/:ticker - Get company profile
router.get('/profile/:ticker', async (req, res) => {
  try {
    const result = await finnhubService.getProfile(req.params.ticker);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finnhub/news/:ticker - Get company news
router.get('/news/:ticker', async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await finnhubService.getNews(req.params.ticker, from, to);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finnhub/metrics/:ticker - Get financial metrics
router.get('/metrics/:ticker', async (req, res) => {
  try {
    const result = await finnhubService.getMetrics(req.params.ticker);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/finnhub/batch-quotes - Get quotes for multiple tickers
router.post('/batch-quotes', async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ success: false, error: 'Tickers array is required' });
    }

    const result = await finnhubService.getBatchQuotes(tickers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/finnhub/candles/:symbol - Get historical candle data
router.get('/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { resolution = 'D', from, to } = req.query;

    // Validate required parameters
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters "from" and "to" (Unix timestamps) are required'
      });
    }

    const result = await finnhubService.getCandles(symbol, resolution, from, to);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
