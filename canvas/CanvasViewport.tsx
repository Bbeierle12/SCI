import React, { useRef, useEffect } from 'react';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewport } from './hooks/useViewport';
import { NodeRenderer } from './nodes/NodeRenderer';

interface CanvasViewportProps {
  className?: string;
}

export function CanvasViewport({ className = '' }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport } = useViewport({
    containerRef,
    minZoom: 0.1,
    maxZoom: 5,
    enablePan: true,
    enableZoom: true,
    enablePinchZoom: true,
  });

  const { nodes, selectedNodeIds, clearSelection } = useCanvasState();

  // Handle click on background to deselect
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only clear selection if clicking directly on the background
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Convert nodes Map to array for rendering
  const nodeArray = Array.from(nodes.values());

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gray-950 ${className}`}
      onClick={handleBackgroundClick}
    >
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${50 * viewport.zoom}px ${50 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Canvas content with viewport transform */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render all nodes */}
        {nodeArray.map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            isSelected={selectedNodeIds.has(node.id)}
          />
        ))}
      </div>

      {/* Viewport controls overlay */}
      <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono pointer-events-none">
        <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
        <div>
          Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
        </div>
        <div>Nodes: {nodeArray.length}</div>
      </div>

      {/* Instructions overlay (shown when canvas is empty) */}
      {nodeArray.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl px-8 py-6 text-center max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">
              Infinite Canvas Ready
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Your canvas is empty. Nodes will appear here as they are added.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600">
                  Drag
                </kbd>
                <span>Pan the canvas</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600">
                  Scroll
                </kbd>
                <span>Zoom in/out</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600">
                  Click
                </kbd>
                <span>Select nodes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
