# Canvas Module

Infinite canvas implementation for the SCI (Supply Chain Intelligence) application.

## Overview

This module provides a complete infinite canvas system with pan/zoom support, node rendering, and state management. Built with React 19, TypeScript, Zustand, and TailwindCSS.

## Features

- **Infinite Canvas**: Unlimited workspace for organizing data
- **Pan & Zoom**: Smooth mouse/touch interactions with min/max zoom constraints (0.1x - 5x)
- **Node Types**: Support for ticker, event, note, and callout nodes
- **Selection**: Single and multi-select with Shift+Click
- **Persistence**: Automatic localStorage backup using Zustand persist middleware
- **Touch Support**: Pinch-to-zoom on mobile/tablet devices
- **Performance**: Uses requestAnimationFrame for smooth animations

## Architecture

```
canvas/
├── hooks/
│   ├── useCanvasState.ts    # Zustand store for canvas state
│   └── useViewport.ts        # Pan/zoom interaction logic
├── nodes/
│   └── NodeRenderer.tsx      # Node type dispatcher & renderers
├── CanvasViewport.tsx        # Main viewport container
├── CanvasDemo.tsx            # Example usage component
└── index.ts                  # Module exports
```

## Quick Start

### Basic Usage

```tsx
import { CanvasViewport, useCanvasState } from '@/canvas';

function MyCanvasApp() {
  const { addNode } = useCanvasState();

  const handleAddNode = () => {
    addNode({
      id: 'node-1',
      boardId: 'my-board',
      type: 'ticker',
      position: { x: 100, y: 100 },
      size: { width: 250, height: 180 },
      data: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.52,
        change: 2.34,
      },
      zIndex: 1,
      locked: false,
    });
  };

  return (
    <div className="w-full h-screen">
      <button onClick={handleAddNode}>Add Node</button>
      <CanvasViewport />
    </div>
  );
}
```

### Demo Component

For a complete working example, see `CanvasDemo.tsx`:

```tsx
import { CanvasDemo } from '@/canvas/CanvasDemo';

// In your app
<CanvasDemo />
```

## Components

### CanvasViewport

Main canvas container component.

**Props:**
- `className?: string` - Optional CSS classes

**Features:**
- Grid background that scales with zoom
- Viewport info overlay (zoom, position, node count)
- Empty state instructions
- Background click to deselect

### NodeRenderer

Renders individual nodes based on their type.

**Supported Node Types:**
- `ticker` - Stock/ticker information cards
- `event` - Timeline events (earnings, news, filings, etc.)
- `note` - Text notes with citations
- `callout` - Alerts and anomalies

## Hooks

### useCanvasState

Zustand store for managing canvas state.

**State:**
```typescript
{
  currentBoardId: string | null;
  nodes: Map<string, CanvasNode>;
  edges: Map<string, Edge>;
  selectedNodeIds: Set<string>;
  viewport: { x: number; y: number; zoom: number };
}
```

**Actions:**
- `setCurrentBoard(boardId: string)` - Set active board
- `addNode(node: CanvasNode)` - Add node to canvas
- `updateNode(id: string, updates: Partial<CanvasNode>)` - Update existing node
- `deleteNode(id: string)` - Remove node and its edges
- `selectNode(id: string, addToSelection?: boolean)` - Select/deselect node
- `clearSelection()` - Clear all selections
- `setViewport(viewport: Viewport)` - Set viewport position/zoom
- `pan(dx: number, dy: number)` - Pan by delta
- `zoom(factor: number, centerX: number, centerY: number)` - Zoom towards point
- `addEdge(edge: Edge)` - Add edge between nodes
- `deleteEdge(id: string)` - Remove edge
- `reset()` - Reset canvas to initial state

### useViewport

Hook for pan/zoom interactions.

**Options:**
```typescript
{
  containerRef: React.RefObject<HTMLDivElement>;
  minZoom?: number;           // Default: 0.1
  maxZoom?: number;           // Default: 5
  zoomSpeed?: number;         // Default: 0.001
  enablePan?: boolean;        // Default: true
  enableZoom?: boolean;       // Default: true
  enablePinchZoom?: boolean;  // Default: true
}
```

**Returns:**
```typescript
{
  viewport: { x: number; y: number; zoom: number };
  isPanning: boolean;
}
```

## Node Types

### TickerNodeData
```typescript
{
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  category?: string;
  role?: string;
  overlaySettings?: OverlaySettings;
}
```

### EventNodeData
```typescript
{
  eventType: 'earnings' | 'news' | 'filing' | 'split' | 'dividend' | 'macro';
  title: string;
  description?: string;
  timestamp: number;
  symbol?: string;
  source?: string;
  url?: string;
}
```

### NoteNodeData
```typescript
{
  title: string;
  text: string;
  color?: string;
  citations?: Citation[];
}
```

### CalloutNodeData
```typescript
{
  title: string;
  text: string;
  alertType: 'anomaly' | 'gap' | 'spike' | 'correlation';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  symbol?: string;
}
```

## Interactions

### Mouse/Trackpad
- **Left Click + Drag**: Pan canvas
- **Middle Click + Drag**: Pan canvas
- **Scroll Wheel**: Zoom in/out (centered on cursor)
- **Click Node**: Select node
- **Shift + Click Node**: Add to selection
- **Click Background**: Clear selection

### Touch (Mobile/Tablet)
- **Single Finger Drag**: Pan canvas
- **Pinch**: Zoom in/out
- **Tap Node**: Select node
- **Tap Background**: Clear selection

## Styling

All components use TailwindCSS with the existing dark theme:
- Background: `bg-gray-950`
- Cards: `bg-gray-900/95` with backdrop blur
- Borders: `border-gray-700`
- Selection: `ring-2 ring-blue-500`
- Grid: Blue grid lines with low opacity

## Performance Considerations

- Uses `requestAnimationFrame` for smooth pan updates
- Map/Set data structures for O(1) lookups
- Viewport culling (future enhancement)
- Memoized node rendering

## Future Enhancements

- [ ] Edge rendering with curved paths
- [ ] Node grouping/containers
- [ ] Viewport culling for large node counts
- [ ] Node dragging to reposition
- [ ] Multi-select drag to move groups
- [ ] Minimap navigation
- [ ] Undo/redo support
- [ ] Export canvas as image
- [ ] Real-time collaboration
- [ ] Custom node templates

## Dependencies

- React 19
- Zustand 5.0.9
- TailwindCSS
- Lucide React (icons)
- TypeScript 5.8

## License

Part of the SCI (Supply Chain Intelligence) application.
