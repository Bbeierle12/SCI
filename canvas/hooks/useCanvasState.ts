import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CanvasNode, Edge, Viewport } from '@/types';

interface CanvasState {
  // Board state
  currentBoardId: string | null;
  nodes: Map<string, CanvasNode>;
  edges: Map<string, Edge>;

  // Selection state
  selectedNodeIds: Set<string>;

  // Viewport state
  viewport: Viewport;

  // Actions
  setCurrentBoard: (boardId: string) => void;
  addNode: (node: CanvasNode) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setViewport: (viewport: Viewport) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, centerX: number, centerY: number) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  reset: () => void;
}

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const useCanvasState = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBoardId: null,
      nodes: new Map(),
      edges: new Map(),
      selectedNodeIds: new Set(),
      viewport: DEFAULT_VIEWPORT,

      // Board management
      setCurrentBoard: (boardId: string) => {
        set({ currentBoardId: boardId });
      },

      // Node management
      addNode: (node: CanvasNode) => {
        set((state) => {
          const newNodes = new Map(state.nodes);
          newNodes.set(node.id, node);
          return { nodes: newNodes };
        });
      },

      updateNode: (id: string, updates: Partial<CanvasNode>) => {
        set((state) => {
          const node = state.nodes.get(id);
          if (!node) return state;

          const newNodes = new Map(state.nodes);
          newNodes.set(id, { ...node, ...updates });
          return { nodes: newNodes };
        });
      },

      deleteNode: (id: string) => {
        set((state) => {
          const newNodes = new Map(state.nodes);
          newNodes.delete(id);

          // Also remove any edges connected to this node
          const newEdges = new Map(state.edges);
          for (const [edgeId, edge] of state.edges) {
            if (edge.sourceId === id || edge.targetId === id) {
              newEdges.delete(edgeId);
            }
          }

          // Remove from selection if selected
          const newSelection = new Set(state.selectedNodeIds);
          newSelection.delete(id);

          return {
            nodes: newNodes,
            edges: newEdges,
            selectedNodeIds: newSelection,
          };
        });
      },

      // Selection management
      selectNode: (id: string, addToSelection = false) => {
        set((state) => {
          const newSelection = addToSelection
            ? new Set(state.selectedNodeIds)
            : new Set<string>();

          if (newSelection.has(id)) {
            newSelection.delete(id);
          } else {
            newSelection.add(id);
          }

          return { selectedNodeIds: newSelection };
        });
      },

      clearSelection: () => {
        set({ selectedNodeIds: new Set() });
      },

      // Viewport management
      setViewport: (viewport: Viewport) => {
        set({ viewport });
      },

      pan: (dx: number, dy: number) => {
        set((state) => ({
          viewport: {
            ...state.viewport,
            x: state.viewport.x + dx,
            y: state.viewport.y + dy,
          },
        }));
      },

      zoom: (factor: number, centerX: number, centerY: number) => {
        set((state) => {
          const currentZoom = state.viewport.zoom;
          const newZoom = Math.max(0.1, Math.min(5, currentZoom * factor));

          // Calculate the new viewport position to zoom towards the cursor
          const zoomChange = newZoom / currentZoom;
          const newX = centerX - (centerX - state.viewport.x) * zoomChange;
          const newY = centerY - (centerY - state.viewport.y) * zoomChange;

          return {
            viewport: {
              x: newX,
              y: newY,
              zoom: newZoom,
            },
          };
        });
      },

      // Edge management
      addEdge: (edge: Edge) => {
        set((state) => {
          const newEdges = new Map(state.edges);
          newEdges.set(edge.id, edge);
          return { edges: newEdges };
        });
      },

      deleteEdge: (id: string) => {
        set((state) => {
          const newEdges = new Map(state.edges);
          newEdges.delete(id);
          return { edges: newEdges };
        });
      },

      // Reset
      reset: () => {
        set({
          nodes: new Map(),
          edges: new Map(),
          selectedNodeIds: new Set(),
          viewport: DEFAULT_VIEWPORT,
        });
      },
    }),
    {
      name: 'canvas-storage',
      // Custom storage to handle Map and Set serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              nodes: new Map(data.state.nodes || []),
              edges: new Map(data.state.edges || []),
              selectedNodeIds: new Set(data.state.selectedNodeIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              ...value.state,
              nodes: Array.from(value.state.nodes.entries()),
              edges: Array.from(value.state.edges.entries()),
              selectedNodeIds: Array.from(value.state.selectedNodeIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
