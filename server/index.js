require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const http = require('http');

// Import routes
const configRoutes = require('./routes/config');
const claudeRoutes = require('./routes/claude');
const finnhubRoutes = require('./routes/finnhub');

// Import WebSocket handler
const { setupWebSocketServer } = require('./websocket/finnhubWs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/api/config', configRoutes);
app.use('/api/claude', claudeRoutes);
app.use('/api/finnhub', finnhubRoutes);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`SCI Backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws/finnhub`);
});
