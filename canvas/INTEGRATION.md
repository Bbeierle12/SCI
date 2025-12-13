# Canvas Integration Guide

Quick guide for integrating the infinite canvas into your SCI application.

## Option 1: Add Canvas as a New Route/Page

If you're using a router, add the canvas as a new page:

```tsx
// In your main App.tsx or router config
import { CanvasDemo } from '@/canvas/CanvasDemo';

// Add route
<Route path="/canvas" element={<CanvasDemo />} />
```

## Option 2: Add Canvas as a Tab/View

If you want the canvas as another view alongside your current stock tracking:

```tsx
import { CanvasViewport } from '@/canvas';
import { useState } from 'react';

function App() {
  const [activeView, setActiveView] = useState<'stocks' | 'canvas'>('stocks');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 p-4 bg-gray-900">
        <button onClick={() => setActiveView('stocks')}>Stock View</button>
        <button onClick={() => setActiveView('canvas')}>Canvas View</button>
      </div>

      {/* Content */}
      {activeView === 'stocks' ? (
        <YourExistingStockView />
      ) : (
        <div className="h-[calc(100vh-80px)]">
          <CanvasViewport />
        </div>
      )}
    </div>
  );
}
```

## Option 3: Custom Integration with Your Stock Data

Programmatically add stocks to the canvas:

```tsx
import { useCanvasState } from '@/canvas';
import { Stock } from '@/types';

function StockToCanvasButton({ stock }: { stock: Stock }) {
  const { addNode } = useCanvasState();

  const handleAddToCanvas = () => {
    addNode({
      id: `ticker-${stock.ticker}`,
      boardId: 'main-board',
      type: 'ticker',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      size: { width: 250, height: 180 },
      data: {
        symbol: stock.ticker,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        category: stock.category,
        role: stock.role,
      },
      zIndex: 1,
      locked: false,
    });
  };

  return (
    <button onClick={handleAddToCanvas}>
      Add to Canvas
    </button>
  );
}
```

## Option 4: Standalone Canvas Page

Create a new standalone page:

```tsx
// pages/CanvasPage.tsx
import React from 'react';
import { CanvasViewport, useCanvasState } from '@/canvas';
import { Plus } from 'lucide-react';

export function CanvasPage() {
  const { addNode } = useCanvasState();

  const handleAddStock = (ticker: string) => {
    // Add your stock fetching logic here
    addNode({
      id: `ticker-${ticker}-${Date.now()}`,
      boardId: 'workspace',
      type: 'ticker',
      position: { x: 100, y: 100 },
      size: { width: 250, height: 180 },
      data: {
        symbol: ticker,
        name: 'Loading...',
      },
      zIndex: 1,
      locked: false,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold text-white">Canvas Workspace</h1>
      </header>
      <div className="flex-1">
        <CanvasViewport />
      </div>
    </div>
  );
}
```

## Testing the Canvas

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the canvas route or view

3. Test interactions:
   - Drag to pan
   - Scroll to zoom
   - Click nodes to select
   - Shift+click for multi-select

## Build Verification

To ensure everything compiles correctly:

```bash
npm run build
```

This will verify:
- TypeScript types are correct
- All imports resolve properly
- No runtime errors in production build

## Troubleshooting

### Module not found errors

If you get import errors, verify your `vite.config.ts` has the `@` alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, '.'),
  },
}
```

### Types not recognized

Make sure `types.ts` is imported correctly. The canvas types are already added to your existing `types.ts` file.

### Canvas not rendering

Check that the container has a defined height:

```tsx
<div className="h-screen"> {/* or h-[600px], etc. */}
  <CanvasViewport />
</div>
```

### Pan/Zoom not working

Ensure the `CanvasViewport` component is receiving pointer events and isn't covered by other elements with higher z-index.

## Next Steps

1. Try the demo: Import and render `<CanvasDemo />` to see all features
2. Customize node styles in `canvas/nodes/NodeRenderer.tsx`
3. Add your own node types by extending the type system
4. Implement node dragging for repositioning
5. Add edge rendering for relationships between nodes
6. Connect to your real-time stock data for live updates

## Performance Tips

- For large canvases (1000+ nodes), consider implementing viewport culling
- Use React.memo for custom node components if rendering is slow
- Batch node additions using a single state update
- Consider using Web Workers for heavy computations

## Additional Resources

- See `canvas/README.md` for full API documentation
- Check `canvas/CanvasDemo.tsx` for example usage
- Review `types.ts` for all available type definitions
