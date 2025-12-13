import React, { useEffect } from 'react';
import { CanvasViewport } from './CanvasViewport';
import { useCanvasState } from './hooks/useCanvasState';
import { Plus, Trash2, Grid } from 'lucide-react';
import { CanvasNode } from '@/types';

/**
 * CanvasDemo - Example component showing how to use the infinite canvas
 *
 * This component demonstrates:
 * - Adding nodes to the canvas
 * - Managing viewport state
 * - Node selection
 * - Pan and zoom interactions
 */
export function CanvasDemo() {
  const { addNode, deleteNode, selectedNodeIds, reset, nodes } = useCanvasState();

  // Add some sample nodes on mount for demo purposes
  useEffect(() => {
    // Only add demo nodes if canvas is empty
    if (nodes.size === 0) {
      addSampleNodes();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSampleNodes = () => {
    // Sample ticker node
    const tickerNode: CanvasNode = {
      id: 'ticker-1',
      boardId: 'demo-board',
      type: 'ticker',
      position: { x: 100, y: 100 },
      size: { width: 250, height: 180 },
      data: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.52,
        change: 2.34,
        category: 'Technology',
        role: 'Device Manufacturer',
      },
      zIndex: 1,
      locked: false,
    };

    // Sample event node
    const eventNode: CanvasNode = {
      id: 'event-1',
      boardId: 'demo-board',
      type: 'event',
      position: { x: 400, y: 100 },
      size: { width: 280, height: 160 },
      data: {
        eventType: 'earnings',
        title: 'Q4 2024 Earnings Report',
        description: 'Apple reports record revenue of $119.6B',
        timestamp: Date.now(),
        symbol: 'AAPL',
        source: 'Apple IR',
      },
      zIndex: 1,
      locked: false,
    };

    // Sample note node
    const noteNode: CanvasNode = {
      id: 'note-1',
      boardId: 'demo-board',
      type: 'note',
      position: { x: 100, y: 320 },
      size: { width: 300, height: 200 },
      data: {
        title: 'Investment Thesis',
        text: 'Strong ecosystem moat with recurring revenue from services. AI integration in upcoming devices could drive upgrade cycle.',
        color: undefined,
        citations: [],
      },
      zIndex: 1,
      locked: false,
    };

    // Sample callout node
    const calloutNode: CanvasNode = {
      id: 'callout-1',
      boardId: 'demo-board',
      type: 'callout',
      position: { x: 450, y: 320 },
      size: { width: 280, height: 180 },
      data: {
        title: 'Supply Chain Alert',
        text: 'Unusual spike in shipping activity from key suppliers in Asia.',
        alertType: 'spike',
        severity: 'medium',
        timestamp: Date.now(),
        symbol: 'AAPL',
      },
      zIndex: 1,
      locked: false,
    };

    addNode(tickerNode);
    addNode(eventNode);
    addNode(noteNode);
    addNode(calloutNode);
  };

  const handleAddRandomNode = () => {
    const types: Array<'ticker' | 'event' | 'note' | 'callout'> = ['ticker', 'event', 'note', 'callout'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const baseData = {
      ticker: {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 245.67,
        change: -1.23,
        category: 'Electric Vehicles',
      },
      event: {
        eventType: 'news' as const,
        title: 'New Product Launch',
        description: 'Company announces exciting new product line',
        timestamp: Date.now(),
      },
      note: {
        title: 'Quick Note',
        text: 'This is a randomly generated note for testing.',
        citations: [],
      },
      callout: {
        title: 'Anomaly Detected',
        text: 'Unusual pattern detected in market data.',
        alertType: 'anomaly' as const,
        severity: 'low' as const,
        timestamp: Date.now(),
      },
    };

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      boardId: 'demo-board',
      type: randomType,
      position: {
        x: Math.random() * 800,
        y: Math.random() * 600,
      },
      size: { width: 280, height: 180 },
      data: baseData[randomType],
      zIndex: 1,
      locked: false,
    };

    addNode(newNode);
  };

  const handleDeleteSelected = () => {
    selectedNodeIds.forEach((id) => {
      deleteNode(id);
    });
  };

  const handleResetCanvas = () => {
    reset();
    addSampleNodes();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-400" />
            Infinite Canvas Demo
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Drag to pan • Scroll to zoom • Click nodes to select
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddRandomNode}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>

          {selectedNodeIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedNodeIds.size})
            </button>
          )}

          <button
            onClick={handleResetCanvas}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <CanvasViewport />
      </div>
    </div>
  );
}
