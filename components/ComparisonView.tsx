import React from 'react';
import { X } from 'lucide-react';
import { Stock } from '../types';

interface ComparisonViewProps {
  selectedTickers: string[];
  allStocks: Stock[];
  onClose: () => void;
  onRemove: (ticker: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ 
  selectedTickers, 
  allStocks, 
  onClose,
  onRemove
}) => {
  const stocks = allStocks.filter(s => selectedTickers.includes(s.ticker));

  if (stocks.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Comparative Intelligence</h2>
            <p className="text-gray-400 text-sm">Comparing {stocks.length} assets across key supply chain metrics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
                <th className="p-4 min-w-[200px] bg-gray-900 text-gray-500 font-medium text-sm uppercase tracking-wider">Metric</th>
                {stocks.map(stock => (
                  <th key={stock.ticker} className="p-4 min-w-[250px] bg-gray-900 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xl font-bold text-white">{stock.ticker}</div>
                        <div className="text-xs text-gray-400 font-normal truncate w-40">{stock.name}</div>
                      </div>
                      <button 
                        onClick={() => onRemove(stock.ticker)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Market Price</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-white font-mono text-lg">
                    ${stock.price.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Change (24h)</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className={`p-4 font-mono font-medium ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change}%
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Market Cap</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-white">
                    {stock.marketCap}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Risk Profile</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4">
                    <span className={`px-2 py-1 rounded-md text-sm font-medium border ${
                      stock.risk === 'Extreme' ? 'bg-red-900/20 text-red-400 border-red-900' :
                      stock.risk === 'High' ? 'bg-orange-900/20 text-orange-400 border-orange-900' :
                      stock.risk === 'Medium' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900' :
                      'bg-blue-900/20 text-blue-400 border-blue-900'
                    }`}>
                      {stock.risk}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Growth Potential</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-emerald-300 font-bold">
                    {stock.growthPotential}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Region</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-gray-300">
                    {stock.region}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium">Supply Chain Role</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-blue-300 text-sm">
                    {stock.role}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium align-top">Description</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4 text-gray-400 text-sm leading-relaxed min-w-[250px]">
                    {stock.description}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4 text-gray-400 font-medium align-top">Tags</td>
                {stocks.map(stock => (
                  <td key={stock.ticker} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {stock.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};