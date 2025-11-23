import React from 'react';
import { X, ArrowUpRight, ArrowDownRight, Trash2, Bookmark, AlertTriangle } from 'lucide-react';
import { Stock } from '../types';

interface WatchlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  allStocks: Stock[];
  onRemove: (ticker: string) => void;
  onSelect: (stock: Stock) => void;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({ 
  isOpen, 
  onClose, 
  watchlist, 
  allStocks, 
  onRemove,
  onSelect
}) => {
  const watchedStocks = allStocks.filter(s => watchlist.includes(s.ticker));

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Watchlist</h2>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{watchedStocks.length}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100vh-65px)] space-y-3 custom-scrollbar">
        {watchedStocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <Bookmark className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">Your watchlist is empty.</p>
                <p className="text-xs mt-1 max-w-[200px]">Click the star icon on any stock card to track it here.</p>
            </div>
        ) : (
            watchedStocks.map(stock => {
                const isPositive = stock.change >= 0;
                return (
                    <div 
                        key={stock.ticker} 
                        onClick={() => onSelect(stock)} 
                        className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 hover:bg-gray-800 cursor-pointer group transition-all duration-200 hover:border-gray-600 hover:shadow-lg relative overflow-hidden"
                    >
                        {/* Background Decor similar to StockCard */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full -mr-4 -mt-4 pointer-events-none" />

                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-white text-lg tracking-tight">{stock.ticker}</h4>
                                    {stock.risk === "Extreme" && (
                                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 truncate w-32 font-medium">{stock.name}</p>
                            </div>
                            <div className={`text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <div className="font-mono text-base font-medium">${stock.price.toFixed(2)}</div>
                                <div className="flex items-center justify-end text-xs font-medium opacity-90">
                                    {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {Math.abs(stock.change)}%
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700/50 relative z-10">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-900/50 px-1.5 py-0.5 rounded">
                                {stock.role.split(' ')[0]}...
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemove(stock.ticker); }}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                                title="Remove from Watchlist"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};