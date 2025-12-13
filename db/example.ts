/**
 * Example usage of the SCI Canvas database layer
 *
 * This file demonstrates common database operations.
 * You can import and use these patterns in your application.
 */

import {
  createBoard,
  addNode,
  addEdge,
  storeCandles,
  createEvent,
  createAgentRun,
  completeAgentRun,
  startAgentRun,
  updateAgentRun,
  getAgentRun,
  getCandles,
  getUpcomingEvents,
  getTimeseriesStats,
  getAgentRunStats,
  getEventStats,
  type Board,
  type Node,
  type TimeseriesCandle
} from './index';

/**
 * Example: Create a new canvas board with nodes and connections
 */
export async function exampleCreateBoard() {
  // Create a new board
  const board = await createBoard('Supply Chain Analysis - AAPL');
  console.log('Created board:', board);

  if (!board.id) {
    throw new Error('Board ID not assigned');
  }

  // Add stock nodes
  const appleNode = await addNode({
    boardId: board.id,
    type: 'stock',
    position: { x: 100, y: 100 },
    size: { width: 300, height: 200 },
    data: {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      price: 185.92,
      change: 2.3
    },
    zIndex: 1,
    locked: false
  });

  const tsmcNode = await addNode({
    boardId: board.id,
    type: 'stock',
    position: { x: 500, y: 100 },
    size: { width: 300, height: 200 },
    data: {
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      price: 172.45,
      change: -0.8
    },
    zIndex: 1,
    locked: false
  });

  // Add chart node
  const chartNode = await addNode({
    boardId: board.id,
    type: 'chart',
    position: { x: 100, y: 400 },
    size: { width: 700, height: 400 },
    data: {
      symbols: ['AAPL', 'TSM'],
      resolution: 'D',
      chartType: 'candlestick'
    },
    zIndex: 0,
    locked: false
  });

  // Create edges showing relationships
  if (appleNode.id && tsmcNode.id) {
    await addEdge({
      boardId: board.id,
      sourceId: appleNode.id,
      targetId: tsmcNode.id,
      type: 'bezier',
      label: 'Supplier'
    });
  }

  console.log('Board setup complete with nodes and edges');
  return board;
}

/**
 * Example: Store and retrieve timeseries data
 */
export async function exampleTimeseriesData() {
  const symbol = 'AAPL';
  const resolution = 'D';

  // Sample candle data for the last 5 days
  const candles: Omit<TimeseriesCandle, 'symbol' | 'resolution'>[] = [
    {
      timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
      open: 180.5,
      high: 182.3,
      low: 179.8,
      close: 181.9,
      volume: 45000000
    },
    {
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      open: 181.9,
      high: 184.1,
      low: 181.2,
      close: 183.5,
      volume: 48000000
    },
    {
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      open: 183.5,
      high: 185.7,
      low: 183.1,
      close: 185.2,
      volume: 52000000
    },
    {
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      open: 185.2,
      high: 186.9,
      low: 184.5,
      close: 185.9,
      volume: 47000000
    },
    {
      timestamp: Date.now(),
      open: 185.9,
      high: 187.2,
      low: 185.3,
      close: 186.8,
      volume: 50000000
    }
  ];

  // Store the candles
  await storeCandles(symbol, resolution, candles);
  console.log(`Stored ${candles.length} candles for ${symbol}`);

  // Retrieve candles for the last week
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const retrieved = await getCandles(symbol, resolution, weekAgo, Date.now());
  console.log(`Retrieved ${retrieved.length} candles`);

  return retrieved;
}

/**
 * Example: Track an AI agent run
 */
export async function exampleAgentRun() {
  // Create a pending agent run
  const run = await createAgentRun({
    agentType: 'stock_analysis',
    status: 'pending',
    input: {
      ticker: 'AAPL',
      analysisType: 'fundamental',
      timeframe: '1Y'
    },
    metadata: {
      requestedBy: 'user123',
      priority: 'high'
    }
  });

  console.log('Created agent run:', run);

  if (!run.id) {
    throw new Error('Agent run ID not assigned');
  }

  // Simulate agent execution
  console.log('Executing agent...');

  // Update to running
  await startAgentRun(run.id);

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Complete with results
  await completeAgentRun(run.id, {
    recommendation: 'BUY',
    confidence: 0.85,
    targetPrice: 210,
    analysis: 'Strong fundamentals with solid revenue growth',
    risks: ['Market volatility', 'Supply chain constraints'],
    opportunities: ['AI integration', 'Services growth']
  });

  console.log('Agent run completed successfully');

  // Retrieve the completed run
  const completed = await getAgentRun(run.id);
  return completed;
}

/**
 * Example: Create and query events
 */
export async function exampleEvents() {
  // Create an earnings event
  const earningsEvent = await createEvent({
    symbol: 'AAPL',
    timestamp: Date.now() + 7 * 24 * 60 * 60 * 1000, // Next week
    type: 'earnings',
    data: {
      quarter: 'Q1 2025',
      estimatedEPS: 1.55,
      estimatedRevenue: 92.5e9
    }
  });

  console.log('Created earnings event:', earningsEvent);

  // Create a dividend event
  const dividendEvent = await createEvent({
    symbol: 'AAPL',
    timestamp: Date.now() + 14 * 24 * 60 * 60 * 1000, // Two weeks
    type: 'dividend',
    data: {
      amount: 0.24,
      exDate: Date.now() + 12 * 24 * 60 * 60 * 1000,
      payDate: Date.now() + 14 * 24 * 60 * 60 * 1000
    }
  });

  console.log('Created dividend event:', dividendEvent);

  // Get all upcoming events
  const upcoming = await getUpcomingEvents(5);
  console.log(`Found ${upcoming.length} upcoming events`);

  return { earningsEvent, dividendEvent, upcoming };
}

/**
 * Example: Complex workflow combining multiple operations
 */
export async function exampleCompleteWorkflow() {
  console.log('Starting complete workflow example...');

  // 1. Create a board
  const board = await createBoard('Market Analysis Dashboard');
  if (!board.id) throw new Error('Board creation failed');

  // 2. Add multiple nodes
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];
  const nodes: Node[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const node = await addNode({
      boardId: board.id,
      type: 'stock',
      position: { x: 100 + i * 250, y: 100 },
      size: { width: 200, height: 150 },
      data: { ticker: symbols[i] },
      zIndex: 1,
      locked: false
    });
    nodes.push(node);
  }

  // 3. Store timeseries data for each symbol
  for (const symbol of symbols) {
    const candles: Omit<TimeseriesCandle, 'symbol' | 'resolution'>[] = Array.from(
      { length: 30 },
      (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        open: 100 + Math.random() * 50,
        high: 110 + Math.random() * 50,
        low: 95 + Math.random() * 50,
        close: 105 + Math.random() * 50,
        volume: 40000000 + Math.random() * 20000000
      })
    );

    await storeCandles(symbol, 'D', candles);
  }

  // 4. Run analysis agents for each symbol
  for (const symbol of symbols) {
    const run = await createAgentRun({
      agentType: 'stock_analysis',
      status: 'pending',
      input: { ticker: symbol }
    });

    if (run.id) {
      await startAgentRun(run.id);
      // Simulate completion
      await completeAgentRun(run.id, {
        recommendation: Math.random() > 0.5 ? 'BUY' : 'HOLD',
        confidence: 0.7 + Math.random() * 0.3
      });
    }
  }

  // 5. Create upcoming events
  for (const symbol of symbols) {
    await createEvent({
      symbol,
      timestamp: Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
      type: 'earnings',
      data: { quarter: 'Q1 2025' }
    });
  }

  console.log('Complete workflow finished successfully');

  // Return summary
  const stats = {
    board,
    nodesCreated: nodes.length,
    timeseriesStats: await getTimeseriesStats(),
    agentStats: await getAgentRunStats(),
    eventStats: await getEventStats()
  };

  return stats;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    console.log('=== SCI Database Examples ===\n');

    console.log('1. Creating board with nodes...');
    await exampleCreateBoard();

    console.log('\n2. Working with timeseries data...');
    await exampleTimeseriesData();

    console.log('\n3. Running AI agent...');
    await exampleAgentRun();

    console.log('\n4. Managing events...');
    await exampleEvents();

    console.log('\n5. Complete workflow...');
    const stats = await exampleCompleteWorkflow();
    console.log('Workflow stats:', JSON.stringify(stats, null, 2));

    console.log('\n=== All examples completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
    throw error;
  }
}

// Uncomment to run examples
// runAllExamples();
