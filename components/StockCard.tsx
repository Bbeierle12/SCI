
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Cpu, AlertTriangle, BarChart3, Box, Zap, CheckCircle2, Circle, ShieldCheck, AlertOctagon, Bell, BrainCircuit, X } from 'lucide-react';
import { Stock } from '../types';
import { getQuickSummary, analyzeStrategicRisk } from '../services/claudeService';

interface StockCardProps {
  stock: Stock;
  onClick: (stock: Stock) => void;
  isSelected: boolean;
  onToggleSelection: (e: React.MouseEvent) => void;
  hasAlert?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ 
  stock, 
  onClick, 
  isSelected,
  onToggleSelection,
  hasAlert
}) => {
  const isPositive = stock.change >= 0;
  const isAppleDirect = stock.tags.includes("Apple Direct");
  const isUS = stock.region === "US" || stock.region === "North America";
  
  const [quickInfo, setQuickInfo] = useState<string | null>(null);
  const [loadingQuick, setLoadingQuick] = useState(false);

  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const handleQuickInfo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quickInfo) return;
    setLoadingQuick(true);
    const info = await getQuickSummary(stock.name, stock.role);
    setQuickInfo(info);
    setLoadingQuick(false);
  };

  const handleRiskAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingRisk(true);
    const analysis = await analyzeStrategicRisk(stock.name);
    setRiskAnalysis(analysis);
    setLoadingRisk(false);
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
      className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 group h-full flex flex-col justify-between overflow-hidden
        ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-900/10' : 'border-gray-800 hover:border-blue-500/50 hover:bg-gray-800'}
      `}
    >
      {/* Actions Bar (Absolute Top) */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20 pointer-events-none">
          {/* Comparison Toggle */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(e);
            }}
            title={isSelected ? "Remove from Comparison" : "Compare Stock"}
            className={`pointer-events-auto p-1.5 rounded-full border backdrop-blur-md transition-all duration-200 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                : 'bg-gray-900/60 border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-500/50'
            }`}
          >
            {isSelected ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {hasAlert && (
              <div className="bg-blue-500 p-1.5 rounded-full shadow-lg shadow-blue-500/40" title="Active Alert Configured">
                <Bell className="w-3 h-3 text-white fill-white" />
              </div>
            )}
            {/* Apple Direct Badge (Static) */}
            {isAppleDirect && (
                <div className="bg-blue-500/20 p-1.5 rounded-full border border-blue-500/30" title="Apple Direct Partner">
                <Cpu className="w-4 h-4 text-blue-400" />
                </div>
            )}
          </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none" />
      
      <div className="mt-8"> {/* Added margin top to clear action bar */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xl text-white tracking-tight">{stock.ticker}</h3>
          </div>
          <div className={`text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            <div className="font-mono text-lg font-medium">${stock.price.toFixed(2)}</div>
            <div className="flex items-center justify-end text-xs font-medium opacity-90">
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(stock.change)}%
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-sm truncate mb-3 font-medium">{stock.name}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
           {/* Risk Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-medium ${riskConfig.bg} ${riskConfig.border} ${riskConfig.color}`}>
            <RiskIcon className="w-3 h-3" />
            {stock.risk} Risk
          </span>

          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${isUS ? 'bg-blue-900/20 border-blue-800/50 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            {stock.region}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-800/50 text-emerald-300 flex items-center gap-1 font-medium">
            <BarChart3 className="w-3 h-3" /> {stock.growthPotential}
          </span>
        </div>

        {/* AI Actions & Info */}
        <div className="min-h-[2.5rem] mb-2 z-10 relative">
             {/* Buttons Row */}
             <div className="flex gap-2 mb-2 min-h-[24px]">
                 {!quickInfo && (
                    <button 
                        onClick={handleQuickInfo}
                        disabled={loadingQuick}
                        className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1.5 transition-all hover:bg-gray-800 px-2 py-1 rounded-md -ml-2"
                    >
                        {loadingQuick ? <span className="animate-pulse">Thinking...</span> : <><Zap className="w-3 h-3" /> Insight</>}
                    </button>
                 )}
                 
                 <button 
                    onClick={handleRiskAnalysis}
                    disabled={loadingRisk}
                    className={`text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1.5 transition-all hover:bg-gray-800 px-2 py-1 rounded-md ${quickInfo ? '-ml-2' : ''}`}
                 >
                    {loadingRisk ? <span className="animate-pulse">Reasoning...</span> : <><BrainCircuit className="w-3 h-3" /> Risk Check</>}
                 </button>
             </div>

             {/* Quick Info Result */}
             {quickInfo && (
                 <div className="text-xs text-blue-200 bg-blue-900/20 p-2 rounded border border-blue-800/30 animate-in fade-in">
                    <Zap className="w-3 h-3 inline mr-1 text-yellow-400 fill-yellow-400" />
                    {quickInfo}
                 </div>
             )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-800 group-hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-100">{stock.role}</span>
        </div>
      </div>

      {/* Risk Analysis Overlay */}
      {riskAnalysis && (
        <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-sm z-30 p-4 overflow-y-auto animate-in fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-3 sticky top-0 bg-gray-950/95 pb-2 border-b border-gray-800">
                <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Strategic Risk
                </h4>
                <button 
                    onClick={() => setRiskAnalysis(null)}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="prose prose-invert prose-sm text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                {riskAnalysis}
            </div>
        </div>
      )}
    </div>
  );
};
