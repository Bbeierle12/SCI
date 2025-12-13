import { expose } from 'comlink';
import type { TimeseriesBar } from '../../types';
import type {
  MAInputs, MAOutput,
  RSIInputs, RSIOutput,
  MACDInputs, MACDOutput,
  BollingerInputs, BollingerOutput
} from '../types';

/**
 * Overlay computation worker
 * Runs heavy calculations off the main thread
 */

// ===== UTILITY FUNCTIONS =====

function getSourceValue(bar: TimeseriesBar, source: string): number {
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

// ===== MOVING AVERAGE COMPUTATIONS =====

function computeSMA(values: number[], period: number): (number | null)[] {
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

function computeEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is SMA
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

function computeWMA(values: number[], period: number): (number | null)[] {
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

// ===== OVERLAY WORKER API =====

const overlayWorker = {
  /**
   * Compute Moving Average
   */
  computeMA(bars: TimeseriesBar[], inputs: MAInputs): MAOutput[] {
    const values = bars.map(bar => getSourceValue(bar, inputs.source));
    let maValues: (number | null)[];

    switch (inputs.type) {
      case 'SMA':
        maValues = computeSMA(values, inputs.period);
        break;
      case 'EMA':
        maValues = computeEMA(values, inputs.period);
        break;
      case 'WMA':
        maValues = computeWMA(values, inputs.period);
        break;
      default:
        maValues = computeSMA(values, inputs.period);
    }

    return bars.map((bar, i) => ({
      timestamp: bar.timestamp,
      value: maValues[i]
    }));
  },

  /**
   * Compute RSI (Relative Strength Index)
   */
  computeRSI(bars: TimeseriesBar[], inputs: RSIInputs): RSIOutput[] {
    const result: RSIOutput[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < bars.length; i++) {
      const change = bars[i].close - bars[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // First point has no RSI
    result.push({ timestamp: bars[0].timestamp, value: null });

    // Calculate RSI for each point
    for (let i = 0; i < gains.length; i++) {
      if (i < inputs.period - 1) {
        result.push({ timestamp: bars[i + 1].timestamp, value: null });
      } else if (i === inputs.period - 1) {
        // First RSI uses simple averages
        let avgGain = 0;
        let avgLoss = 0;
        for (let j = 0; j < inputs.period; j++) {
          avgGain += gains[i - j];
          avgLoss += losses[i - j];
        }
        avgGain /= inputs.period;
        avgLoss /= inputs.period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push({ timestamp: bars[i + 1].timestamp, value: rsi });
      } else {
        // Subsequent RSI uses smoothed averages
        const prevResult = result[result.length - 1];
        if (prevResult.value === null) {
          result.push({ timestamp: bars[i + 1].timestamp, value: null });
        } else {
          // Calculate smoothed averages (simplified)
          let avgGain = 0;
          let avgLoss = 0;
          for (let j = 0; j < inputs.period; j++) {
            avgGain += gains[i - j];
            avgLoss += losses[i - j];
          }
          avgGain /= inputs.period;
          avgLoss /= inputs.period;

          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          result.push({ timestamp: bars[i + 1].timestamp, value: rsi });
        }
      }
    }

    return result;
  },

  /**
   * Compute MACD (Moving Average Convergence Divergence)
   */
  computeMACD(bars: TimeseriesBar[], inputs: MACDInputs): MACDOutput[] {
    const closes = bars.map(bar => bar.close);

    // Calculate fast and slow EMAs
    const fastEMA = computeEMA(closes, inputs.fastPeriod);
    const slowEMA = computeEMA(closes, inputs.slowPeriod);

    // Calculate MACD line
    const macdLine: (number | null)[] = [];
    for (let i = 0; i < bars.length; i++) {
      if (fastEMA[i] === null || slowEMA[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(fastEMA[i]! - slowEMA[i]!);
      }
    }

    // Calculate signal line (EMA of MACD)
    const macdValues = macdLine.filter((v): v is number => v !== null);
    const signalEMA = computeEMA(macdValues, inputs.signalPeriod);

    // Map signal back to full array
    const signalLine: (number | null)[] = [];
    let signalIdx = 0;
    for (let i = 0; i < bars.length; i++) {
      if (macdLine[i] === null) {
        signalLine.push(null);
      } else {
        signalLine.push(signalEMA[signalIdx++] ?? null);
      }
    }

    // Build result
    return bars.map((bar, i) => ({
      timestamp: bar.timestamp,
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: macdLine[i] !== null && signalLine[i] !== null
        ? macdLine[i]! - signalLine[i]!
        : null
    }));
  },

  /**
   * Compute Bollinger Bands
   */
  computeBollinger(bars: TimeseriesBar[], inputs: BollingerInputs): BollingerOutput[] {
    const values = bars.map(bar => getSourceValue(bar, inputs.source));
    const sma = computeSMA(values, inputs.period);

    return bars.map((bar, i) => {
      if (sma[i] === null || i < inputs.period - 1) {
        return {
          timestamp: bar.timestamp,
          upper: null,
          middle: null,
          lower: null
        };
      }

      // Calculate standard deviation
      let sumSquares = 0;
      for (let j = 0; j < inputs.period; j++) {
        const diff = values[i - j] - sma[i]!;
        sumSquares += diff * diff;
      }
      const stdDev = Math.sqrt(sumSquares / inputs.period);

      return {
        timestamp: bar.timestamp,
        upper: sma[i]! + (inputs.stdDev * stdDev),
        middle: sma[i],
        lower: sma[i]! - (inputs.stdDev * stdDev)
      };
    });
  },

  /**
   * Compute VWAP (Volume Weighted Average Price)
   */
  computeVWAP(bars: TimeseriesBar[]): { timestamp: number; value: number | null }[] {
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    return bars.map(bar => {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      cumulativeTPV += typicalPrice * bar.volume;
      cumulativeVolume += bar.volume;

      if (cumulativeVolume === 0) {
        return { timestamp: bar.timestamp, value: null };
      }

      return {
        timestamp: bar.timestamp,
        value: cumulativeTPV / cumulativeVolume
      };
    });
  }
};

// Expose the worker API
expose(overlayWorker);

// Export type for use with Comlink
export type OverlayWorkerAPI = typeof overlayWorker;
