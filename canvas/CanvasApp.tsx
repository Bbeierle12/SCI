import React, { useEffect, useCallback, useState } from 'react';
import { CanvasViewport } from './CanvasViewport';
import { useCanvasState } from './hooks/useCanvasState';
import type { Stock, CanvasNode, TickerNodeData } from '../types';
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize2, Grid3X3 } from 'lucide-react';

interface CanvasAppProps {
  stocks: Stock[];
  onStockUpdate?: (ticker: string, updates: Partial<Stock>) => void;
}

/**
 * Main Canvas Application
 * Wraps CanvasViewport with toolbar and stock migration logic
 */
export function CanvasApp({ stocks, onStockUpdate }: CanvasAppProps) {
  const {
    nodes,
    addNode,
    updateNode,
    deleteNode,
    selectedNodeIds,
    clearSelection,
    viewport,
    setViewport,
    reset
  } = useCanvasState();

  const [hasMigrated, setHasMigrated] = useState(false);

  // Migrate stocks to canvas nodes on first load
  useEffect(() => {
    if (hasMigrated || nodes.size > 0) return;

    // Grid layout configuration
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 180;
    const PADDING = 24;
    const COLS = 4;

    stocks.forEach((stock, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      const node: CanvasNode = {
        id: `ticker-${stock.ticker.toLowerCase()}`,
        boardId: 'default',
        type: 'ticker',
        position: {
          x: col * (NODE_WIDTH + PADDING) + 100,
          y: row * (NODE_HEIGHT + PADDING) + 100,
        },
        size: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },
        data: {
          symbol: stock.ticker,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          category: stock.category,
          role: stock.role,
        } as TickerNodeData,
        zIndex: index,
        locked: false,
      };

      addNode(node);
    });

    setHasMigrated(true);
  }, [stocks, nodes.size, addNode, hasMigrated]);

  // Sync stock price updates to canvas nodes
  useEffect(() => {
    stocks.forEach(stock => {
      const nodeId = `ticker-${stock.ticker.toLowerCase()}`;
      const existingNode = nodes.get(nodeId);

      if (existingNode && existingNode.type === 'ticker') {
        const currentData = existingNode.data as TickerNodeData;
        if (currentData.price !== stock.price || currentData.change !== stock.change) {
          updateNode(nodeId, {
            data: {
              ...currentData,
              price: stock.price,
              change: stock.change,
            },
          });
        }
      }
    });
  }, [stocks, nodes, updateNode]);

  // Toolbar actions
  const handleZoomIn = useCallback(() => {
    setViewport({
      ...viewport,
      zoom: Math.min(5, viewport.zoom * 1.2),
    });
  }, [viewport, setViewport]);

  const handleZoomOut = useCallback(() => {
    setViewport({
      ...viewport,
      zoom: Math.max(0.1, viewport.zoom / 1.2),
    });
  }, [viewport, setViewport]);

  const handleFitToScreen = useCallback(() => {
    // Reset to default view
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  const handleDeleteSelected = useCallback(() => {
    selectedNodeIds.forEach(id => deleteNode(id));
    clearSelection();
  }, [selectedNodeIds, deleteNode, clearSelection]);

  const handleAutoArrange = useCallback(() => {
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 180;
    const PADDING = 24;
    const COLS = 4;

    const nodeArray = Array.from(nodes.values());
    nodeArray.forEach((node, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      updateNode(node.id, {
        position: {
          x: col * (NODE_WIDTH + PADDING) + 100,
          y: row * (NODE_HEIGHT + PADDING) + 100,
        },
      });
    });

    // Center viewport
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [nodes, updateNode, setViewport]);

  return (
    <div className="relative w-full h-full">
      {/* Canvas Viewport */}
      <CanvasViewport className="w-full h-full" />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-2 flex items-center gap-1">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <button
          onClick={handleFitToScreen}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleAutoArrange}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Auto Arrange"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {selectedNodeIds.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="p-2 rounded-lg hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
            title={`Delete Selected (${selectedNodeIds.size})`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="px-2 text-xs font-mono text-gray-500">
          {nodes.size} nodes
        </div>
      </div>
    </div>
  );
}
