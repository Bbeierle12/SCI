
import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Cpu, BarChart3,
    BrainCircuit, Globe, FileText, Loader2, ExternalLink,
    AlertTriangle, ShieldCheck, AlertOctagon, RefreshCw,
    Activity, Gauge, Bell, DollarSign, Calendar
} from 'lucide-react';
import { Stock, SearchResult, IntelligenceMetrics, FinnhubQuote, FinnhubProfile, FinnhubNewsItem, FinnhubMetrics } from '../types';
import { analyzeStrategicRisk, getRecentSupplyChainNews, getStockIntelligence } from '../services/claudeService';
import { getQuote, getProfile, getNews as getFinnhubNews, getMetrics as getFinnhubMetrics, formatMarketCap, formatNewsDate } from '../services/finnhubService';

interface DetailViewProps {
  stock: Stock;
  onClose: () => void;
  onSetAlert?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ stock, onClose, onSetAlert }) => {
  const isPositive = stock.change >= 0;
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'intelligence' | 'financials' | 'news'>('overview');
  
  // AI States
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newsData, setNewsData] = useState<SearchResult | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Finnhub Live Data States
  const [liveQuote, setLiveQuote] = useState<FinnhubQuote | null>(null);
  const [profile, setProfile] = useState<FinnhubProfile | null>(null);
  const [finnhubNews, setFinnhubNews] = useState<FinnhubNewsItem[]>([]);
  const [financials, setFinancials] = useState<FinnhubMetrics | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isLoadingFinnhubNews, setIsLoadingFinnhubNews] = useState(false);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

  // Fetch live data on mount
  useEffect(() => {
    const fetchLiveData = async () => {
      setIsLoadingLive(true);
      try {
        const [quoteData, profileData] = await Promise.all([
          getQuote(stock.ticker),
          getProfile(stock.ticker)
        ]);
        setLiveQuote(quoteData);
        setProfile(profileData);
      } catch (e) {
        console.error('Failed to fetch live data:', e);
      }
      setIsLoadingLive(false);
    };
    fetchLiveData();
  }, [stock.ticker]);

  const handleFetchFinnhubNews = async (force = false) => {
    if (finnhubNews.length > 0 && !force) return;
    setIsLoadingFinnhubNews(true);
    const news = await getFinnhubNews(stock.ticker, 14); // Last 2 weeks
    setFinnhubNews(news);
    setIsLoadingFinnhubNews(false);
  };

  const handleFetchFinancials = async (force = false) => {
    if (financials && !force) return;
    setIsLoadingFinancials(true);
    const data = await getFinnhubMetrics(stock.ticker);
    setFinancials(data);
    setIsLoadingFinancials(false);
  };

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
                className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'intelligence' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <Activity className="w-4 h-4" /> Intelligence
            </button>
            <button
                onClick={() => { setActiveTab('financials'); handleFetchFinancials(); }}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'financials' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <DollarSign className="w-4 h-4" /> Financials
            </button>
            <button
                onClick={() => { setActiveTab('news'); handleFetchFinnhubNews(); }}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'news' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                <Globe className="w-4 h-4" /> News
            </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar grow">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Live Quote from Finnhub */}
                    {liveQuote && (
                      <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live Market Data (Finnhub)</span>
                          {isLoadingLive && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Current</p>
                            <p className="text-2xl font-mono font-bold text-white">${liveQuote.c.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Change</p>
                            <p className={`text-lg font-bold ${liveQuote.dp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {liveQuote.dp >= 0 ? '+' : ''}{liveQuote.dp.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Day High</p>
                            <p className="text-sm font-mono text-gray-300">${liveQuote.h.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Day Low</p>
                            <p className="text-sm font-mono text-gray-300">${liveQuote.l.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Open: <span className="text-gray-300 font-mono">${liveQuote.o.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Prev Close: <span className="text-gray-300 font-mono">${liveQuote.pc.toFixed(2)}</span></p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback to static data if no live quote */}
                    {!liveQuote && (
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
                    )}

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

            {/* TAB: FINANCIALS (Finnhub) */}
            {activeTab === 'financials' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Financial Metrics
                        </h3>
                        <button
                            onClick={() => handleFetchFinancials(true)}
                            disabled={isLoadingFinancials}
                            className={`p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors ${isLoadingFinancials ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingFinancials ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {isLoadingFinancials ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-500/50" />
                            <p>Loading financial data from Finnhub...</p>
                        </div>
                    ) : financials?.metric ? (
                        <div className="space-y-4">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">P/E Ratio</p>
                                    <p className="text-2xl font-mono font-bold text-white">
                                        {financials.metric.peNormalizedAnnual?.toFixed(2) ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <p className="text-xs text-gray-500 mb-1">EPS (Annual)</p>
                                    <p className="text-2xl font-mono font-bold text-white">
                                        ${financials.metric.epsNormalizedAnnual?.toFixed(2) ?? 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* 52 Week Range */}
                            <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-300">52 Week Range</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-rose-400">
                                        ${financials.metric['52WeekLow']?.toFixed(2) ?? '?'}
                                    </span>
                                    <div className="flex-1 bg-gray-900 rounded-full h-2 relative">
                                        {liveQuote && financials.metric['52WeekLow'] && financials.metric['52WeekHigh'] && (
                                            <div
                                                className="absolute w-3 h-3 bg-cyan-400 rounded-full -top-0.5 shadow-lg shadow-cyan-400/50"
                                                style={{
                                                    left: `${Math.min(100, Math.max(0, ((liveQuote.c - financials.metric['52WeekLow']) / (financials.metric['52WeekHigh'] - financials.metric['52WeekLow'])) * 100))}%`
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-mono text-emerald-400">
                                        ${financials.metric['52WeekHigh']?.toFixed(2) ?? '?'}
                                    </span>
                                </div>
                                {liveQuote && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Current: <span className="text-cyan-400 font-mono">${liveQuote.c.toFixed(2)}</span>
                                    </p>
                                )}
                            </div>

                            {/* Additional Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                                    <p className="text-lg font-mono text-white">
                                        {financials.metric.marketCapitalization
                                            ? formatMarketCap(financials.metric.marketCapitalization)
                                            : profile?.marketCapitalization
                                                ? formatMarketCap(profile.marketCapitalization)
                                                : stock.marketCap}
                                    </p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">Dividend Yield</p>
                                    <p className="text-lg font-mono text-white">
                                        {financials.metric.dividendYieldIndicatedAnnual
                                            ? `${financials.metric.dividendYieldIndicatedAnnual.toFixed(2)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">Beta</p>
                                    <p className="text-lg font-mono text-white">
                                        {financials.metric.beta?.toFixed(2) ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">Revenue Growth (YoY)</p>
                                    <p className={`text-lg font-mono ${(financials.metric.revenueGrowthQuarterlyYoy ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {financials.metric.revenueGrowthQuarterlyYoy
                                            ? `${financials.metric.revenueGrowthQuarterlyYoy.toFixed(1)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Company Profile */}
                            {profile && (
                                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        {profile.logo && (
                                            <img src={profile.logo} alt={profile.name} className="w-8 h-8 rounded-lg bg-white p-1" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-white">{profile.name}</p>
                                            <p className="text-xs text-gray-500">{profile.finnhubIndustry} • {profile.exchange}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-gray-500">Country: <span className="text-gray-300">{profile.country}</span></div>
                                        <div className="text-gray-500">IPO: <span className="text-gray-300">{profile.ipo || 'N/A'}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-dashed border-gray-800">
                            <DollarSign className="w-12 h-12 text-gray-600 mb-3 mx-auto opacity-50" />
                            <p className="text-gray-500">Unable to load financial data.</p>
                            <p className="text-xs text-gray-600 mt-1">Check Finnhub API key configuration.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: NEWS (Finnhub) */}
            {activeTab === 'news' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300 h-full flex flex-col">
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 mb-2 flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2 text-emerald-300 mb-1">
                                <Globe className="w-4 h-4" />
                                <h3 className="font-semibold text-sm">Company News</h3>
                            </div>
                            <p className="text-xs text-emerald-200/60">
                                Real-time news from Finnhub API
                            </p>
                        </div>
                        <button
                            onClick={() => handleFetchFinnhubNews(true)}
                            disabled={isLoadingFinnhubNews}
                            className={`p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors hover:text-white ${isLoadingFinnhubNews ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh News"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingFinnhubNews ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {isLoadingFinnhubNews ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
                             <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500/50" />
                             <p className="text-sm">Fetching latest news...</p>
                         </div>
                    ) : finnhubNews.length > 0 ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                            {finnhubNews.slice(0, 10).map((article) => (
                                <a
                                    key={article.id}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-500/40 transition-all group"
                                >
                                    <div className="flex gap-4">
                                        {article.image && (
                                            <img
                                                src={article.image}
                                                alt=""
                                                className="w-20 h-20 object-cover rounded-lg shrink-0 bg-gray-900"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-sm text-gray-200 group-hover:text-white font-medium mb-2 line-clamp-2">
                                                {article.headline}
                                            </h5>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                {article.summary}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatNewsDate(article.datetime)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    {article.source}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center">
                            <Globe className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
                            <p className="text-sm text-gray-400">No recent news found for {stock.ticker}</p>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
