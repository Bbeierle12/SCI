const express = require('express');
const { checkClaudeAvailable, queryClaudeCLI } = require('../services/claudeService');

const router = express.Router();

// GET /api/claude/available - Check if Claude CLI is available
router.get('/available', (req, res) => {
  try {
    const available = checkClaudeAvailable();
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/claude/query - Query Claude CLI
router.post('/query', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const response = await queryClaudeCLI(prompt, options || {});
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
