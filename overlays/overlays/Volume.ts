import type { TimeseriesBar, CandleResolution, Viewport } from '../../types';
import type { Overlay, VolumeInputs, VolumeOutput, RenderOptions } from '../types';

/**
 * Volume Overlay
 * Displays volume bars colored by price direction
 */
export class VolumeOverlay implements Overlay<VolumeInputs, VolumeOutput> {
  id = 'volume';
  name = 'Volume';
  category: 'volume' = 'volume';
  zIndex = 5;
  separatePane = true; // Volume typically shown in separate pane

  defaultInputs: VolumeInputs = {
    colorUp: '#26a69a',
    colorDown: '#ef5350',
    opacity: 0.7
  };

  invalidateOn: ('newBar' | 'inputChange' | 'manual' | 'resolution')[] = [
    'newBar',
    'inputChange'
  ];

  lodConfig = {
    minZoom: 0.1,
    maxZoom: 10,
    availableResolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M'] as CandleResolution[]
  };

  compute(bars: TimeseriesBar[], inputs: VolumeInputs): VolumeOutput[] {
    return bars.map((bar, i) => {
      // Determine color based on price direction
      const isUp = i === 0 ? bar.close >= bar.open : bar.close >= bars[i - 1].close;

      return {
        timestamp: bar.timestamp,
        volume: bar.volume,
        color: isUp ? inputs.colorUp : inputs.colorDown
      };
    });
  }

  cacheKey(symbol: string, resolution: CandleResolution, _inputs: VolumeInputs): string {
    return `volume:${symbol}:${resolution}`;
  }

  render(
    ctx: CanvasRenderingContext2D,
    data: VolumeOutput[],
    _viewport: Viewport,
    options: RenderOptions
  ): void {
    const { width, height, timeRange } = options;

    // Find max volume for scaling
    const visibleData = data.filter(
      d => d.timestamp >= timeRange.from && d.timestamp <= timeRange.to
    );

    if (visibleData.length === 0) return;

    const maxVolume = Math.max(...visibleData.map(d => d.volume));
    if (maxVolume === 0) return;

    const barWidth = Math.max(1, (width / visibleData.length) * 0.8);
    const gap = (width / visibleData.length) * 0.1;

    ctx.globalAlpha = this.defaultInputs.opacity;

    visibleData.forEach((point, i) => {
      const x = (i / visibleData.length) * width + gap;
      const barHeight = (point.volume / maxVolume) * height;
      const y = height - barHeight;

      ctx.fillStyle = point.color;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    ctx.globalAlpha = 1;
  }
}

export const volumeOverlay = new VolumeOverlay();
