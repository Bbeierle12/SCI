import React, { useMemo, useState } from 'react';
import { Stock } from '../types';
import { PieChart, CircleDollarSign } from 'lucide-react';

interface MarketCapChartProps {
  stocks: Stock[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI & Compute": "#3b82f6", // Blue 500
  "Quantum": "#a855f7",      // Purple 500
  "Strategic Materials": "#10b981", // Emerald 500
  "Metals & Mining": "#f59e0b", // Amber 500
  "Semi Equip": "#06b6d4",   // Cyan 500
  "Battery & Power": "#84cc16", // Lime 500
  "Components": "#ec4899",   // Pink 500
  "Manufacturing": "#64748b", // Slate 500
  "Other": "#4b5563"         // Gray 600
};

export const MarketCapChart: React.FC<MarketCapChartProps> = ({ stocks }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Parse Market Caps into standardized Billions
  const data = useMemo(() => {
    return stocks.map(stock => {
      let value = 0;
      const capStr = stock.marketCap.toUpperCase().replace('$', '');
      const num = parseFloat(capStr);
      
      if (capStr.includes('T')) value = num * 1000;
      else if (capStr.includes('B')) value = num;
      else if (capStr.includes('M')) value = num / 1000;
      else value = num; // Assumption if no suffix

      return {
        ...stock,
        value, // In Billions
        color: CATEGORY_COLORS[stock.category] || CATEGORY_COLORS["Other"]
      };
    }).sort((a, b) => b.value - a.value); // Sort largest to smallest for better visualization
  }, [stocks]);

  const totalMarketCap = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  // 2. SVG Math for Donut Chart
  // We use stroke-dasharray on a circle to create segments
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const slices = data.map((item, index) => {
    const percent = item.value / totalMarketCap;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...item,
      percent,
      strokeDasharray,
      strokeDashoffset,
      index
    };
  });

  // 3. Legend Data (Unique Categories)
  const legendData = useMemo(() => {
    const categories = new Set(data.map(d => d.category));
    return Array.from(categories).map((cat: string) => ({
      name: cat,
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"],
      count: data.filter(d => d.category === cat).length
    }));
  }, [data]);

  if (stocks.length === 0) return null;

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
         <div className="p-2 bg-indigo-500/10 rounded-lg">
            <PieChart className="w-6 h-6 text-indigo-400" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-white">Market Capitalization Distribution</h2>
            <p className="text-sm text-gray-400">Visualizing relative scale of tracked assets (Filtered View)</p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Chart Area */}
        <div className="relative w-64 h-64 shrink-0 group">
           {/* SVG Chart */}
           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {slices.map((slice) => (
                <circle
                  key={slice.ticker}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className={`transition-all duration-300 cursor-pointer hover:opacity-90 ${hoveredIndex === slice.index ? 'stroke-[14px]' : 'opacity-80'}`}
                  onMouseEnter={() => setHoveredIndex(slice.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
           </svg>
           
           {/* Center Text (Donut Hole) */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeSlice ? (
                <>
                  <div className="text-2xl font-bold text-white animate-in fade-in zoom-in-95 duration-200">
                    {activeSlice.marketCap}
                  </div>
                  <div className="text-xs text-gray-400 font-medium bg-gray-950/80 px-2 py-0.5 rounded mt-1 border border-gray-800">
                    {activeSlice.ticker}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {(activeSlice.percent * 100).toFixed(1)}% Share
                  </div>
                </>
              ) : (
                <>
                  <CircleDollarSign className="w-8 h-8 text-gray-700 mb-2" />
                  <div className="text-sm font-medium text-gray-500">Total Cap</div>
                  <div className="text-lg font-bold text-gray-300">
                    ${(totalMarketCap / 1000).toFixed(2)}T
                  </div>
                </>
              )}
           </div>
        </div>

        {/* Legend Area */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
            {legendData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-300">{item.name}</span>
                    <span className="text-[10px] text-gray-500">{item.count} asset{item.count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top 5 List (If hovering nothing) */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Top Assets by Valuation</h4>
            <div className="space-y-2">
                {slices.slice(0, 4).map(slice => (
                    <div 
                        key={slice.ticker}
                        onMouseEnter={() => setHoveredIndex(slice.index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`flex justify-between items-center p-2 rounded-lg border border-transparent transition-all cursor-pointer ${hoveredIndex === slice.index ? 'bg-gray-800 border-gray-700' : 'hover:bg-gray-800/50'}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: slice.color }} />
                            <span className="text-sm font-medium text-gray-300">{slice.name}</span>
                        </div>
                        <span className="font-mono text-sm text-gray-400">{slice.marketCap}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};