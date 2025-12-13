import type { TimeseriesBar, CandleResolution, Viewport, CanvasEvent } from '../../types';
import type { Overlay, EventMarkerInputs, EventMarkerOutput, RenderOptions } from '../types';

/**
 * Event Markers Overlay
 * Displays vertical lines for earnings, news, filings, etc.
 */
export class EventMarkersOverlay implements Overlay<EventMarkerInputs, EventMarkerOutput> {
  id = 'event-markers';
  name = 'Event Markers';
  category: 'event' = 'event';
  zIndex = 100; // High z-index to show on top
  separatePane = false;

  // Events to be rendered (injected externally)
  private events: CanvasEvent[] = [];

  defaultInputs: EventMarkerInputs = {
    showEarnings: true,
    showNews: true,
    showFilings: true,
    showSplits: true,
    showDividends: true,
    showMacro: false
  };

  invalidateOn: ('newBar' | 'inputChange' | 'manual' | 'resolution')[] = [
    'inputChange',
    'manual'
  ];

  lodConfig = {
    minZoom: 0.1,
    maxZoom: 10,
    availableResolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M'] as CandleResolution[]
  };

  /**
   * Set events to be displayed
   */
  setEvents(events: CanvasEvent[]): void {
    this.events = events;
  }

  compute(_bars: TimeseriesBar[], inputs: EventMarkerInputs): EventMarkerOutput[] {
    return this.events
      .filter(event => {
        switch (event.type) {
          case 'earnings': return inputs.showEarnings;
          case 'news': return inputs.showNews;
          case 'filing': return inputs.showFilings;
          case 'split': return inputs.showSplits;
          case 'dividend': return inputs.showDividends;
          case 'macro': return inputs.showMacro;
          default: return true;
        }
      })
      .map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        title: event.title,
        description: event.description,
        color: this.getEventColor(event.type)
      }));
  }

  cacheKey(symbol: string, resolution: CandleResolution, inputs: EventMarkerInputs): string {
    const flags = [
      inputs.showEarnings ? 'e' : '',
      inputs.showNews ? 'n' : '',
      inputs.showFilings ? 'f' : '',
      inputs.showSplits ? 's' : '',
      inputs.showDividends ? 'd' : '',
      inputs.showMacro ? 'm' : ''
    ].join('');
    return `events:${symbol}:${resolution}:${flags}`;
  }

  render(
    ctx: CanvasRenderingContext2D,
    data: EventMarkerOutput[],
    _viewport: Viewport,
    options: RenderOptions
  ): void {
    const { width, height, timeRange } = options;

    const visibleEvents = data.filter(
      e => e.timestamp >= timeRange.from && e.timestamp <= timeRange.to
    );

    for (const event of visibleEvents) {
      const x = ((event.timestamp - timeRange.from) / (timeRange.to - timeRange.from)) * width;

      // Draw vertical dashed line
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = event.color;
      ctx.lineWidth = 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw marker icon at top
      ctx.fillStyle = event.color;
      ctx.beginPath();
      ctx.arc(x, 10, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw event type icon
      ctx.fillStyle = '#fff';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.getEventIcon(event.type), x, 10);
    }
  }

  private getEventColor(type: string): string {
    switch (type) {
      case 'earnings': return '#FFD700'; // Gold
      case 'news': return '#2196F3';     // Blue
      case 'filing': return '#9C27B0';   // Purple
      case 'split': return '#4CAF50';    // Green
      case 'dividend': return '#FF9800'; // Orange
      case 'macro': return '#F44336';    // Red
      default: return '#9E9E9E';         // Grey
    }
  }

  private getEventIcon(type: string): string {
    switch (type) {
      case 'earnings': return 'E';
      case 'news': return 'N';
      case 'filing': return 'F';
      case 'split': return 'S';
      case 'dividend': return 'D';
      case 'macro': return 'M';
      default: return '?';
    }
  }
}

export const eventMarkersOverlay = new EventMarkersOverlay();
