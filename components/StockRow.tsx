import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Cpu, AlertTriangle, BarChart3, CheckCircle2, Circle, ShieldCheck, AlertOctagon, Zap, Box } from 'lucide-react';
import { Stock } from '../types';
import { getQuickSummary } from '../services/claudeService';

interface StockRowProps {
  stock: Stock;
  onClick: (stock: Stock) => void;
  isSelected: boolean;
  onToggleSelection: (e: React.MouseEvent) => void;
}

export const StockRow: React.FC<StockRowProps> = ({ 
  stock, 
  onClick, 
  isSelected,
  onToggleSelection 
}) => {
  const isPositive = stock.change >= 0;
  const isAppleDirect = stock.tags.includes("Apple Direct");
  
  const [quickInfo, setQuickInfo] = useState<string | null>(null);
  const [loadingQuick, setLoadingQuick] = useState(false);

  const handleQuickInfo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quickInfo) return;
    setLoadingQuick(true);
    const info = await getQuickSummary(stock.name, stock.role);
    setQuickInfo(info);
    setLoadingQuick(false);
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low': return { color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800/50', icon: ShieldCheck };
      case 'Medium': return { color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/50', icon: AlertTriangle };
      case 'High': return { color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800/50', icon: AlertTriangle };
      case 'Extreme': return { color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/50', icon: AlertOctagon };
      default: return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: AlertTriangle };
    }
  };

  const riskConfig = getRiskConfig(stock.risk);
  const RiskIcon = riskConfig.icon;

  return (
    <div 
      onClick={() => onClick(stock)}
      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md relative overflow-visible ${
        isSelected 
          ? 'bg-blue-900/20 border-blue-500' 
          : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button 
            onClick={(e) => { e.stopPropagation(); onToggleSelection(e); }}
            className={`p-1.5 rounded-full border transition-all ${
                isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 text-gray-600 hover:text-blue-400'
            }`}
        >
            {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        </button>
      </div>

      {/* Ticker & Name */}
      <div className="min-w-[140px]">
        <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">{stock.ticker}</span>
            {isAppleDirect && <Cpu className="w-3.5 h-3.5 text-blue-400" title="Apple Direct Partner" />}
        </div>
        <span className="text-xs text-gray-400 truncate block max-w-[120px]">{stock.name}</span>
      </div>

      {/* Price */}
      <div className="min-w-[100px]">
        <div className="font-mono text-white font-medium">${stock.price.toFixed(2)}</div>
        <div className={`text-xs flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(stock.change)}%
        </div>
      </div>

      {/* Role */}
      <div className="flex-1 min-w-[200px] hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-semibold text-blue-100">{stock.role}</span>
          </div>
          <p className="text-[10px] text-gray-500 truncate max-w-[250px]">{stock.description}</p>
      </div>

      {/* Risk & Stats */}
      <div className="hidden lg:flex items-center gap-3 min-w-[250px]">
          <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-medium whitespace-nowrap ${riskConfig.bg} ${riskConfig.border} ${riskConfig.color}`}>
            <RiskIcon className="w-3 h-3" />
            {stock.risk}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-800/50 text-emerald-300 flex items-center gap-1 font-medium whitespace-nowrap">
            <BarChart3 className="w-3 h-3" /> {stock.growthPotential}
          </span>
      </div>

      {/* AI Quick Info */}
      <div className="w-[40px] flex justify-end shrink-0 relative">
         <button 
            onClick={handleQuickInfo}
            className="text-gray-600 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-gray-800"
            title="Quick AI Insight"
         >
             {loadingQuick ? <Zap className="w-4 h-4 animate-pulse text-blue-400" /> : <Zap className={`w-4 h-4 ${quickInfo ? 'text-blue-400 fill-blue-400' : ''}`} />}
         </button>
         {quickInfo && (
             <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl w-64 z-50 animate-in fade-in zoom-in-95">
                 <div className="text-xs text-blue-200 leading-relaxed">{quickInfo}</div>
             </div>
         )}
      </div>

    </div>
  );
};