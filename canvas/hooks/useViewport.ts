import { useEffect, useRef, useCallback } from 'react';
import { useCanvasState } from './useCanvasState';

interface UseViewportOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  enablePinchZoom?: boolean;
}

interface UseViewportReturn {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  isPanning: boolean;
}

const DEFAULT_MIN_ZOOM = 0.1;
const DEFAULT_MAX_ZOOM = 5;
const DEFAULT_ZOOM_SPEED = 0.001;

export function useViewport({
  containerRef,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  zoomSpeed = DEFAULT_ZOOM_SPEED,
  enablePan = true,
  enableZoom = true,
  enablePinchZoom = true,
}: UseViewportOptions): UseViewportReturn {
  const { viewport, pan, zoom, setViewport } = useCanvasState();
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pendingPanRef = useRef({ dx: 0, dy: 0 });
  const lastPinchDistanceRef = useRef<number | null>(null);

  // Handle smooth pan updates using requestAnimationFrame
  const applyPendingPan = useCallback(() => {
    if (pendingPanRef.current.dx !== 0 || pendingPanRef.current.dy !== 0) {
      pan(pendingPanRef.current.dx, pendingPanRef.current.dy);
      pendingPanRef.current = { dx: 0, dy: 0 };
    }
    animationFrameRef.current = null;
  }, [pan]);

  const schedulePan = useCallback(
    (dx: number, dy: number) => {
      pendingPanRef.current.dx += dx;
      pendingPanRef.current.dy += dy;

      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(applyPendingPan);
      }
    },
    [applyPendingPan]
  );

  // Mouse/Touch event handlers
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enablePan) return;

      // Left mouse button or middle mouse button
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };

        // Change cursor
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    },
    [enablePan, containerRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanningRef.current || !enablePan) return;

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      lastPosRef.current = { x: e.clientX, y: e.clientY };
      schedulePan(dx, dy);
    },
    [enablePan, schedulePan]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;

      // Reset cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  }, [containerRef]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!enableZoom) return;

      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouse position to canvas space
      const canvasX = (mouseX - viewport.x) / viewport.zoom;
      const canvasY = (mouseY - viewport.y) / viewport.zoom;

      // Calculate zoom factor
      const delta = -e.deltaY;
      const factor = 1 + delta * zoomSpeed;

      // Clamp zoom level
      const newZoom = Math.max(minZoom, Math.min(maxZoom, viewport.zoom * factor));
      const actualFactor = newZoom / viewport.zoom;

      // Calculate new viewport position
      const newX = mouseX - canvasX * newZoom;
      const newY = mouseY - canvasY * newZoom;

      setViewport({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    },
    [enableZoom, viewport, minZoom, maxZoom, zoomSpeed, containerRef, setViewport]
  );

  // Touch event handlers for pinch-to-zoom
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && enablePinchZoom) {
        e.preventDefault();
        lastPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1 && enablePan) {
        isPanningRef.current = true;
        lastPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [enablePan, enablePinchZoom, getTouchDistance]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && enablePinchZoom && lastPinchDistanceRef.current !== null) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;

        // Convert center to canvas space
        const canvasX = (centerX - viewport.x) / viewport.zoom;
        const canvasY = (centerY - viewport.y) / viewport.zoom;

        // Calculate zoom factor from pinch distance change
        const factor = currentDistance / lastPinchDistanceRef.current;

        // Clamp zoom level
        const newZoom = Math.max(minZoom, Math.min(maxZoom, viewport.zoom * factor));

        // Calculate new viewport position
        const newX = centerX - canvasX * newZoom;
        const newY = centerY - canvasY * newZoom;

        setViewport({
          x: newX,
          y: newY,
          zoom: newZoom,
        });

        lastPinchDistanceRef.current = currentDistance;
      } else if (e.touches.length === 1 && isPanningRef.current && enablePan) {
        const dx = e.touches[0].clientX - lastPosRef.current.x;
        const dy = e.touches[0].clientY - lastPosRef.current.y;

        lastPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };

        schedulePan(dx, dy);
      }
    },
    [
      enablePan,
      enablePinchZoom,
      viewport,
      minZoom,
      maxZoom,
      containerRef,
      setViewport,
      getTouchDistance,
      getTouchCenter,
      schedulePan,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    isPanningRef.current = false;
    lastPinchDistanceRef.current = null;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial cursor
    container.style.cursor = 'grab';

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Wheel event
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);

      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return {
    viewport,
    isPanning: isPanningRef.current,
  };
}
