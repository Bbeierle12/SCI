const express = require('express');
const { getMaskedFinnhubKey, setFinnhubApiKey, clearFinnhubApiKey } = require('../services/configService');
const finnhubService = require('../services/finnhubService');

const router = express.Router();

// GET /api/config/finnhub-key - Get masked API key status
router.get('/finnhub-key', (req, res) => {
  try {
    const result = getMaskedFinnhubKey();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/finnhub-key - Set Finnhub API key
router.post('/finnhub-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }

    const success = setFinnhubApiKey(apiKey.trim());
    if (success) {
      // Clear cache when key changes
      finnhubService.clearCache();
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save config' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/config/finnhub-key - Clear Finnhub API key
router.delete('/finnhub-key', (req, res) => {
  try {
    clearFinnhubApiKey();
    finnhubService.clearCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
