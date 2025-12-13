import type { TimeseriesBar, CandleResolution, Viewport } from '../../types';
import type { Overlay, MAInputs, MAOutput, RenderOptions } from '../types';

/**
 * Moving Average Overlay
 * Supports SMA, EMA, and WMA
 */
export class MovingAverageOverlay implements Overlay<MAInputs, MAOutput> {
  id = 'moving-average';
  name = 'Moving Average';
  category: 'price' = 'price';
  zIndex = 10;
  separatePane = false;

  defaultInputs: MAInputs = {
    period: 20,
    type: 'SMA',
    source: 'close',
    color: '#2962FF',
    lineWidth: 2
  };

  invalidateOn: ('newBar' | 'inputChange' | 'manual' | 'resolution')[] = [
    'newBar',
    'inputChange',
    'resolution'
  ];

  lodConfig = {
    minZoom: 0.1,
    maxZoom: 10,
    availableResolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M'] as CandleResolution[]
  };

  compute(bars: TimeseriesBar[], inputs: MAInputs): MAOutput[] {
    const values = bars.map(bar => this.getSourceValue(bar, inputs.source));
    let maValues: (number | null)[];

    switch (inputs.type) {
      case 'SMA':
        maValues = this.computeSMA(values, inputs.period);
        break;
      case 'EMA':
        maValues = this.computeEMA(values, inputs.period);
        break;
      case 'WMA':
        maValues = this.computeWMA(values, inputs.period);
        break;
      default:
        maValues = this.computeSMA(values, inputs.period);
    }

    return bars.map((bar, i) => ({
      timestamp: bar.timestamp,
      value: maValues[i]
    }));
  }

  cacheKey(symbol: string, resolution: CandleResolution, inputs: MAInputs): string {
    return `ma:${symbol}:${resolution}:${inputs.type}:${inputs.period}:${inputs.source}`;
  }

  render(
    ctx: CanvasRenderingContext2D,
    data: MAOutput[],
    _viewport: Viewport,
    options: RenderOptions
  ): void {
    const { width, height, priceRange, timeRange } = options;

    ctx.beginPath();
    ctx.strokeStyle = this.defaultInputs.color;
    ctx.lineWidth = this.defaultInputs.lineWidth;

    let started = false;

    for (const point of data) {
      if (point.value === null) continue;
      if (point.timestamp < timeRange.from || point.timestamp > timeRange.to) continue;

      const x = ((point.timestamp - timeRange.from) / (timeRange.to - timeRange.from)) * width;
      const y = height - ((point.value - priceRange.min) / (priceRange.max - priceRange.min)) * height;

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  // === Helper methods ===

  private getSourceValue(bar: TimeseriesBar, source: string): number {
    switch (source) {
      case 'open': return bar.open;
      case 'high': return bar.high;
      case 'low': return bar.low;
      case 'close': return bar.close;
      case 'hl2': return (bar.high + bar.low) / 2;
      case 'hlc3': return (bar.high + bar.low + bar.close) / 3;
      case 'ohlc4': return (bar.open + bar.high + bar.low + bar.close) / 4;
      default: return bar.close;
    }
  }

  private computeSMA(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[i - j];
        }
        result.push(sum / period);
      }
    }

    return result;
  }

  private computeEMA(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[i - j];
        }
        result.push(sum / period);
      } else {
        const prevEma = result[i - 1];
        if (prevEma === null) {
          result.push(null);
        } else {
          result.push((values[i] - prevEma) * multiplier + prevEma);
        }
      }
    }

    return result;
  }

  private computeWMA(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const denominator = (period * (period + 1)) / 2;

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += values[i - j] * (period - j);
        }
        result.push(sum / denominator);
      }
    }

    return result;
  }
}

export const movingAverageOverlay = new MovingAverageOverlay();
