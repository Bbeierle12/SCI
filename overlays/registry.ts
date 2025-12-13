import type { Overlay, OverlayRegistry, OverlayRegistryEntry } from './types';
import { movingAverageOverlay, MovingAverageOverlay } from './overlays/MovingAverage';
import { volumeOverlay, VolumeOverlay } from './overlays/Volume';
import { eventMarkersOverlay, EventMarkersOverlay } from './overlays/EventMarkers';

/**
 * Global overlay registry
 * Maintains all available overlays and their factories
 */
class OverlayRegistryManager {
  private registry: OverlayRegistry = new Map();

  constructor() {
    // Register built-in overlays
    this.registerBuiltIns();
  }

  /**
   * Register a new overlay
   */
  register(entry: OverlayRegistryEntry): void {
    if (this.registry.has(entry.id)) {
      console.warn(`Overlay ${entry.id} is already registered. Overwriting.`);
    }
    this.registry.set(entry.id, entry);
  }

  /**
   * Get an overlay by ID
   */
  get(id: string): Overlay | undefined {
    const entry = this.registry.get(id);
    return entry?.factory();
  }

  /**
   * Get all registered overlays
   */
  getAll(): OverlayRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get overlays by category
   */
  getByCategory(category: Overlay['category']): OverlayRegistryEntry[] {
    return this.getAll().filter(entry => entry.category === category);
  }

  /**
   * Check if an overlay is registered
   */
  has(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * Remove an overlay from the registry
   */
  unregister(id: string): boolean {
    return this.registry.delete(id);
  }

  /**
   * Register built-in overlays
   */
  private registerBuiltIns(): void {
    // Moving Average
    this.register({
      id: 'moving-average',
      name: 'Moving Average',
      category: 'price',
      factory: () => new MovingAverageOverlay()
    });

    // Volume
    this.register({
      id: 'volume',
      name: 'Volume',
      category: 'volume',
      factory: () => new VolumeOverlay()
    });

    // Event Markers
    this.register({
      id: 'event-markers',
      name: 'Event Markers',
      category: 'event',
      factory: () => new EventMarkersOverlay()
    });
  }
}

// Export singleton instance
export const overlayRegistry = new OverlayRegistryManager();

// Export individual overlay instances for direct use
export { movingAverageOverlay, volumeOverlay, eventMarkersOverlay };

// Export overlay classes for custom instantiation
export { MovingAverageOverlay, VolumeOverlay, EventMarkersOverlay };

/**
 * Get default overlay settings for a new ticker node
 */
export function getDefaultOverlaySettings() {
  return {
    enabledOverlays: ['volume'],
    overlayConfigs: {
      'moving-average': {
        id: 'moving-average',
        enabled: false,
        inputs: movingAverageOverlay.defaultInputs
      },
      'volume': {
        id: 'volume',
        enabled: true,
        inputs: volumeOverlay.defaultInputs
      },
      'event-markers': {
        id: 'event-markers',
        enabled: false,
        inputs: eventMarkersOverlay.defaultInputs
      }
    }
  };
}
