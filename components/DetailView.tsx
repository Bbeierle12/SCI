
import React, { useState } from 'react';
import { 
    TrendingUp, TrendingDown, Cpu, BarChart3, 
    BrainCircuit, Globe, FileText, Loader2, ExternalLink,
    AlertTriangle, ShieldCheck, AlertOctagon, RefreshCw,
    Activity, Gauge, ArrowRight, Layers, Bell
} from 'lucide-react';
import { Stock, SearchResult, IntelligenceMetrics } from '../types';
import { analyzeStrategicRisk, getRecentSupplyChainNews, getStockIntelligence } from '../services/claudeService';

interface DetailViewProps {
  stock: Stock;
  onClose: () => void;
  onSetAlert?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ stock, onClose, onSetAlert }) => {
  const isPositive = stock.change >= 0;
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'intelligence' | 'news'>('overview');
  
  // AI States
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newsData, setNewsData] = useState<SearchResult | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const handleDeepAnalysis = async () => {
    if (analysis) return;
    setIsAnalyzing(true);
    const result = await analyzeStrategicRisk(stock.name);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleFetchNews = async (force = false) => {
    if (newsData && !force) return;
    setIsLoadingNews(true);
    if (force) setNewsData(null); 
    const result = await getRecentSupplyChainNews(stock.name);
    setNewsData(result);
    setIsLoadingNews(false);
  };

  const handleFetchMetrics = async (force = false) => {
    if (metrics && !force) return;
    setIsLoadingMetrics(true);
    if (force) setMetrics(null);
    const result = await getStockIntelligence(stock.ticker);
    setMetrics(result);
    setIsLoadingMetrics(false);
  }

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck };
      case 'Medium': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle };
      case 'High': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle };
      case 'Extreme': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertOctagon };
      default: return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: AlertTriangle };
    }
  };

  const riskConfig = getRiskConfig(stock.risk);
  const RiskIcon = riskConfig.icon;

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Source';
    }
  };

  // Helper for circular gauge
  const GaugeVisual = ({ value, label, color }: { value: number, label: string, color: string }) => {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center">
         <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90">
               <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
               <circle 
                 cx="48" cy="48" r="40" 
                 stroke="currentColor" strokeWidth="8" 
                 fill="transparent" 
                 strokeDasharray={circumference} 
                 strokeDashoffset={offset}
                 strokeLinecap="round"
                 className={`${color} transition-all duration-1000 ease-out`}
               />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
               <span className={`text-xl font-bold ${color}`}>{value}</span>
            </div>
         </div>
         <span className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wide">{label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gray-900 border-b border-gray-800 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              {stock.name}
              <span className="text-gray-500 text-xl font-light">({stock.ticker})</span>
            </h2>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              {stock.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSetAlert && (
              <button 
                onClick={onSetAlert}
                className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors bg-gray-800 p-2 rounded-lg"
                title="Set Custom Alert"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50 shrink-0 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => { setActiveTab('analysis'); handleDeepAnalysis(); }}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'analysis' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <BrainCircuit className="w-4 h-4" /> Analysis
            </button>
            <button 
                onClick={() => { setActiveTab('intelligence'); handleFetchMetrics(); }}
                className={`flex-1 min-w-[140px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'intelligence' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <Activity className="w-4 h-4" /> Live Intelligence
            </button>
            <button 
                onClick={() => { setActiveTab('news'); handleFetchNews(); }}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'news' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <Globe className="w-4 h-4" /> Live News
            </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar grow">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                            <p className="text-sm text-gray-400 mb-1">Current Price</p>
                            <div className="text-4xl font-mono font-light text-white">
                            ${stock.price.toFixed(stock.ticker === 'LQMT' ? 3 : 2)}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center items-end">
                            <div className={`flex items-center px-3 py-1.5 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {isPositive ? <TrendingUp className="w-5 h-5 mr-2" /> : <TrendingDown className="w-5 h-5 mr-2" />}
                                <span className="font-bold text-lg">{stock.change > 0 ? '+' : ''}{stock.change}%</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        The Apple Connection
                        </h3>
                        <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-5">
                        <p className="text-gray-200 leading-relaxed">
                            {stock.description}
                        </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                        <p className="text-lg font-medium text-white">{stock.marketCap}</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-xl p-4 flex justify-between">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Growth Est.</p>
                            <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" /> {stock.growthPotential}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className="text-xs text-gray-500 mb-1">Risk Profile</p>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${riskConfig.bg} ${riskConfig.border} ${riskConfig.color}`}>
                                <RiskIcon className="w-4 h-4" />
                                <span className="font-bold">{stock.risk}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                        {stock.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                            {tag}
                        </span>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: ANALYSIS (Thinking Mode) */}
            {activeTab === 'analysis' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300 h-full flex flex-col">
                     <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-purple-300 mb-2">
                            <BrainCircuit className="w-5 h-5" />
                            <h3 className="font-semibold">Claude Deep Analysis</h3>
                        </div>
                        <p className="text-xs text-purple-200/70">
                            This analysis uses high-budget thinking tokens to reason through complex geopolitical and technical risks.
                        </p>
                     </div>

                     {isAnalyzing ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                             <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-500" />
                             <p>Analyzing strategic vectors...</p>
                             <p className="text-xs text-gray-600 mt-2">Allocating thinking budget...</p>
                         </div>
                     ) : (
                         <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-gray-300 whitespace-pre-wrap">
                             {analysis}
                         </div>
                     )}
                </div>
            )}

             {/* TAB: LIVE INTELLIGENCE (Metrics) */}
             {activeTab === 'intelligence' && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Gauge className="w-4 h-4" /> Real-Time Metrics
                        </h3>
                        <button 
                            onClick={() => handleFetchMetrics(true)}
                            disabled={isLoadingMetrics}
                            className={`p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors ${isLoadingMetrics ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {isLoadingMetrics ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                             <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500/50" />
                             <p>Calculating intelligence metrics...</p>
                        </div>
                    ) : metrics ? (
                        <div className="space-y-6">
                            {/* Top Row: Gauges */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-800/30 p-6 rounded-2xl border border-gray-800">
                                <GaugeVisual 
                                    value={metrics.sentimentScore} 
                                    label="Market Sentiment" 
                                    color={metrics.sentimentScore > 60 ? 'text-emerald-400' : metrics.sentimentScore < 40 ? 'text-rose-400' : 'text-blue-400'}
                                />
                                <GaugeVisual 
                                    value={metrics.supplyChainHealth} 
                                    label="Supply Health" 
                                    color={metrics.supplyChainHealth > 70 ? 'text-emerald-400' : 'text-amber-400'}
                                />
                            </div>

                            {/* Trend Indicator */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Sentiment Trend</span>
                                <div className={`flex items-center gap-2 font-bold ${
                                    metrics.sentimentTrend === 'Bullish' ? 'text-emerald-400' : 
                                    metrics.sentimentTrend === 'Bearish' ? 'text-rose-400' : 'text-gray-300'
                                }`}>
                                    {metrics.sentimentTrend === 'Bullish' ? <TrendingUp className="w-4 h-4" /> :
                                     metrics.sentimentTrend === 'Bearish' ? <TrendingDown className="w-4 h-4" /> :
                                     <Activity className="w-4 h-4" />}
                                    {metrics.sentimentTrend}
                                </div>
                            </div>

                            {/* Innovation Bar */}
                            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4 text-purple-400" /> Innovation Index
                                    </span>
                                    <span className="text-xl font-bold text-white">{metrics.innovationIndex}/100</span>
                                </div>
                                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all duration-1000" 
                                        style={{ width: `${metrics.innovationIndex}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Based on patent filings and R&D spend estimates.</p>
                            </div>

                            {/* Key Levels */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Support Level</p>
                                    <p className="text-lg font-mono text-emerald-400 font-bold">{metrics.technicalSupport}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
                                    <p className="text-xs text-gray-500 uppercase mb-1">Resistance Level</p>
                                    <p className="text-lg font-mono text-rose-400 font-bold">{metrics.technicalResistance}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                             <p className="text-gray-500">Unable to load metrics.</p>
                        </div>
                    )}
                 </div>
             )}

            {/* TAB: NEWS (Search Grounding) */}
            {activeTab === 'news' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300 h-full flex flex-col">
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 mb-2 flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-300 mb-1">
                                <Globe className="w-4 h-4" />
                                <h3 className="font-semibold text-sm">Live News Feed</h3>
                            </div>
                            <p className="text-xs text-emerald-200/60">
                                Real-time ground truth via Google Search.
                            </p>
                        </div>
                        <button 
                            onClick={() => handleFetchNews(true)}
                            disabled={isLoadingNews}
                            className={`p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors hover:text-white ${isLoadingNews ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh News"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingNews ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {isLoadingNews ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
                             <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500/50" />
                             <p className="text-sm">Scanning global news feeds...</p>
                         </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {/* Summary Text */}
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap mb-6 leading-relaxed">
                                {newsData?.text}
                            </div>
                            
                            {/* Sources List */}
                            {newsData?.sources && newsData.sources.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Verified Sources</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {newsData.sources.map((source, idx) => (
                                            <a 
                                                key={idx}
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-500/40 transition-all group"
                                            >
                                                <div className="mt-0.5 bg-gray-900 p-1.5 rounded-md text-gray-500 group-hover:text-emerald-400 transition-colors border border-gray-800 shrink-0">
                                                    <img 
                                                        src={`https://www.google.com/s2/favicons?domain=${getHostname(source.uri)}&sz=32`}
                                                        alt="icon"
                                                        className="w-4 h-4 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <FileText className="w-4 h-4 hidden" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm text-gray-300 group-hover:text-white truncate font-medium mb-0.5">{source.title}</h5>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span className="truncate">{getHostname(source.uri)}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {!isLoadingNews && newsData && (!newsData.sources || newsData.sources.length === 0) && (
                                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center">
                                    <Globe className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
                                    <p className="text-sm text-gray-400">Analysis complete, but no specific web sources were cited.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
