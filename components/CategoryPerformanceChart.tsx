import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { Stock } from '../types';

interface CategoryPerformanceChartProps {
  stocks: Stock[];
}

export const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({ stocks }) => {
  const data = useMemo(() => {
    const agg: Record<string, { total: number; count: number }> = {};
    
    stocks.forEach(stock => {
      if (!agg[stock.category]) {
        agg[stock.category] = { total: 0, count: 0 };
      }
      agg[stock.category].total += stock.change;
      agg[stock.category].count += 1;
    });

    return Object.entries(agg)
      .map(([category, { total, count }]) => ({
        category,
        avgChange: total / count,
        count
      }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  if (stocks.length === 0) return null;

  // Determine scale based on the maximum absolute change
  const maxAbsValue = Math.max(...data.map(d => Math.abs(d.avgChange)), 0.1);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 animate-in fade-in duration-500 h-full">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
         <div className="p-2 bg-emerald-500/10 rounded-lg">
            <BarChart2 className="w-6 h-6 text-emerald-400" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-white">Sector Momentum</h2>
            <p className="text-sm text-gray-400">Average daily performance by category</p>
         </div>
      </div>

      <div className="space-y-5 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
        {data.map((item) => {
            const isPositive = item.avgChange >= 0;
            const widthPercent = (Math.abs(item.avgChange) / maxAbsValue) * 100;
            
            return (
                <div key={item.category} className="group">
                    <div className="flex justify-between items-end text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-medium">{item.category}</span>
                            <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 rounded border border-gray-700">{item.count}</span>
                        </div>
                        <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{item.avgChange.toFixed(2)}%
                        </span>
                    </div>
                    
                    {/* Bar Container */}
                    <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                            style={{ width: `${widthPercent}%` }}
                        />
                    </div>
                </div>
            );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center">
        <span>Data aggregated from {stocks.length} active assets</span>
        <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Gain
            <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span> Loss
        </span>
      </div>
    </div>
  );
};