import React, { useCallback } from 'react';
import { CanvasNode, TickerNodeData, EventNodeData, NoteNodeData, CalloutNodeData } from '@/types';
import { useCanvasState } from '../hooks/useCanvasState';
import { TrendingUp, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface NodeRendererProps {
  node: CanvasNode;
  isSelected: boolean;
}

export function NodeRenderer({ node, isSelected }: NodeRendererProps) {
  const { selectNode } = useCanvasState();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(node.id, e.shiftKey);
    },
    [node.id, selectNode]
  );

  const baseClasses = `
    absolute cursor-pointer transition-all duration-200
    ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/30' : 'hover:ring-1 hover:ring-blue-400/50'}
  `;

  // Render based on node type
  switch (node.type) {
    case 'ticker':
      return (
        <TickerNode
          node={node}
          data={node.data as TickerNodeData}
          isSelected={isSelected}
          onClick={handleClick}
          className={baseClasses}
        />
      );

    case 'event':
      return (
        <EventNode
          node={node}
          data={node.data as EventNodeData}
          isSelected={isSelected}
          onClick={handleClick}
          className={baseClasses}
        />
      );

    case 'note':
      return (
        <NoteNode
          node={node}
          data={node.data as NoteNodeData}
          isSelected={isSelected}
          onClick={handleClick}
          className={baseClasses}
        />
      );

    case 'callout':
      return (
        <CalloutNode
          node={node}
          data={node.data as CalloutNodeData}
          isSelected={isSelected}
          onClick={handleClick}
          className={baseClasses}
        />
      );

    default:
      return (
        <div
          className={baseClasses}
          style={{
            left: node.position.x,
            top: node.position.y,
            width: node.size.width,
            height: node.size.height,
            zIndex: node.zIndex,
          }}
          onClick={handleClick}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Unknown node type</div>
          </div>
        </div>
      );
  }
}

// Individual node type components

interface NodeComponentProps {
  node: CanvasNode;
  data: unknown;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  className: string;
}

function TickerNode({ node, data, isSelected, onClick, className }: NodeComponentProps) {
  const tickerData = data as TickerNodeData;
  const hasPrice = tickerData.price !== undefined;
  const isPositive = (tickerData.change ?? 0) >= 0;

  return (
    <div
      className={className}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
      onClick={onClick}
    >
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-4 backdrop-blur-sm h-full flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-lg text-white">{tickerData.symbol}</h3>
            </div>
            {hasPrice && (
              <span
                className={`text-sm font-mono font-medium ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${tickerData.price?.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm truncate">{tickerData.name}</p>
        </div>

        {hasPrice && tickerData.change !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{Math.abs(tickerData.change).toFixed(2)}%</span>
            </div>
          </div>
        )}

        {tickerData.category && (
          <div className="mt-2">
            <span className="text-xs px-2 py-1 rounded bg-blue-900/30 border border-blue-800/50 text-blue-300">
              {tickerData.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function EventNode({ node, data, isSelected, onClick, className }: NodeComponentProps) {
  const eventData = data as EventNodeData;
  const date = new Date(eventData.timestamp);

  return (
    <div
      className={className}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
      onClick={onClick}
    >
      <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4 backdrop-blur-sm h-full">
        <div className="flex items-start gap-2 mb-2">
          <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{eventData.title}</h3>
            <p className="text-xs text-purple-300/70 mt-1">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {eventData.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mt-2">{eventData.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/30 border border-purple-800/50 text-purple-300">
            {eventData.eventType}
          </span>
          {eventData.symbol && (
            <span className="text-xs text-purple-400 font-mono">{eventData.symbol}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteNode({ node, data, isSelected, onClick, className }: NodeComponentProps) {
  const noteData = data as NoteNodeData;
  const bgColor = noteData.color || 'bg-yellow-900/20';
  const borderColor = noteData.color
    ? `border-${noteData.color}-700/50`
    : 'border-yellow-700/50';

  return (
    <div
      className={className}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
      onClick={onClick}
    >
      <div
        className={`${bgColor} border ${borderColor} rounded-xl p-4 backdrop-blur-sm h-full flex flex-col`}
      >
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <h3 className="font-bold text-white text-sm flex-1">{noteData.title}</h3>
        </div>

        <div className="flex-1 overflow-auto">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{noteData.text}</p>
        </div>

        {noteData.citations && noteData.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-yellow-700/30">
            <div className="text-xs text-yellow-400/70">
              {noteData.citations.length} citation{noteData.citations.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CalloutNode({ node, data, isSelected, onClick, className }: NodeComponentProps) {
  const calloutData = data as CalloutNodeData;

  const severityConfig = {
    low: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-700/50',
      text: 'text-blue-400',
      icon: 'text-blue-400',
    },
    medium: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-700/50',
      text: 'text-yellow-400',
      icon: 'text-yellow-400',
    },
    high: {
      bg: 'bg-red-900/20',
      border: 'border-red-700/50',
      text: 'text-red-400',
      icon: 'text-red-400',
    },
  };

  const config = severityConfig[calloutData.severity];
  const date = new Date(calloutData.timestamp);

  return (
    <div
      className={className}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex,
      }}
      onClick={onClick}
    >
      <div
        className={`${config.bg} border ${config.border} rounded-xl p-4 backdrop-blur-sm h-full flex flex-col`}
      >
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className={`w-5 h-5 ${config.icon} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm ${config.text}`}>{calloutData.title}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-300 flex-1">{calloutData.text}</p>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded ${config.bg} border ${config.border} ${config.text}`}>
            {calloutData.alertType}
          </span>
          {calloutData.symbol && (
            <span className={`font-mono ${config.text}`}>{calloutData.symbol}</span>
          )}
        </div>
      </div>
    </div>
  );
}
