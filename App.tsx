
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Globe,
  Cpu,
  AlertTriangle,
  Zap,
  Flag,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Plus,
  Loader2,
  Sparkles,
  Bell,
  ChevronDown,
  RefreshCw,
  Pause,
  Play,
  Settings,
  Map
} from 'lucide-react';
import { Stock, AlertConfig, AppNotification } from './types';
import { STOCK_DATA, PRIVATE_DATA } from './constants';
import { StockCard } from './components/StockCard';
import { StockRow } from './components/StockRow';
import { PrivateCompanyCard } from './components/PrivateCompanyCard';
import { DetailView } from './components/DetailView';
import { ChatBot } from './components/ChatBot';
import { ComparisonView } from './components/ComparisonView';
import { MarketCapChart } from './components/MarketCapChart';
import { CategoryPerformanceChart } from './components/CategoryPerformanceChart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertsPanel } from './components/AlertsPanel';
import { AlertSetupModal } from './components/AlertSetupModal';
import { generateStockData } from './services/claudeService';
import { useFinnhubRefresh } from './hooks/useFinnhubRefresh';
import { useFinnhubWebSocket } from './hooks/useFinnhubWebSocket';
import { SettingsModal } from './components/SettingsModal';
import { CanvasApp } from './canvas/CanvasApp';

export default function App() {
  // Data State
  const [allStocks, setAllStocks] = useState<Stock[]>(STOCK_DATA);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const allStocksRef = useRef(allStocks);
  allStocksRef.current = allStocks; // Keep ref in sync
  
  // Alerts & Notifications State
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [stockForAlertSetup, setStockForAlertSetup] = useState<Stock | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter State
  const [filter, setFilter] = useState("All");
  const [highlightFilter, setHighlightFilter] = useState("None");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Feature State
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'canvas'>('canvas');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  
  // Async Action State
  const [isAddingStock, setIsAddingStock] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);

  // Finnhub refresh callback (for REST API polling fallback)
  const handleFinnhubUpdate = useCallback((updates: Map<string, Partial<Stock>>) => {
    setAllStocks(prev => prev.map(stock => {
      const update = updates.get(stock.ticker);
      if (update) {
        return {
          ...stock,
          price: update.price ?? stock.price,
          change: update.change ?? stock.change
        };
      }
      return stock;
    }));
  }, []);

  // WebSocket real-time price update callback
  const handleWebSocketPriceUpdate = useCallback((ticker: string, price: number) => {
    setAllStocks(prev => prev.map(stock => {
      if (stock.ticker.toUpperCase() === ticker.toUpperCase()) {
        // Calculate percent change from current price
        const prevPrice = stock.price;
        const change = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
        return {
          ...stock,
          price: price,
          // Keep the daily change from REST snapshot, don't update with tick-to-tick change
        };
      }
      return stock;
    }));
  }, []);

  // Finnhub WebSocket hook for real-time streaming
  const {
    wsState,
    latestPrices,
    ticksBySymbol
  } = useFinnhubWebSocket({
    stocks: allStocks,
    enabled: true,
    onPriceUpdate: handleWebSocketPriceUpdate,
    onError: (error) => {
      // Only show WebSocket errors if they're not about missing API key
      if (!error.includes('not configured') && !error.includes('API key')) {
        console.warn('WebSocket error:', error);
      }
    }
  });

  // Finnhub REST polling hook (fallback + initial data)
  const {
    state: finnhubState,
    refresh: manualRefresh,
    toggleAutoRefresh
  } = useFinnhubRefresh({
    stocks: allStocks,
    autoRefreshInterval: 60000, // 60 seconds - fallback polling
    enabled: true,
    onUpdate: handleFinnhubUpdate,
    onError: (error) => {
      // Only show error toast if it's not the API key warning (that's expected on first load)
      if (!error.includes('not configured')) {
        showToast(error, 'error');
      }
    }
  });

  // --- Helper Functions ---

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddNotification = (title: string, message: string, type: 'alert' | 'info' = 'info') => {
    const newNote: AppNotification = {
        id: Date.now().toString(),
        title,
        message,
        timestamp: Date.now(),
        read: false,
        type
    };
    setNotifications(prev => [newNote, ...prev]);
    showToast(title, type === 'alert' ? 'info' : 'success');
  };

  // --- Alert Logic ---

  const handleAddAlert = (config: Omit<AlertConfig, 'id' | 'active' | 'triggered'>) => {
    const newAlert: AlertConfig = {
        ...config,
        id: Date.now().toString(),
        active: true,
        triggered: false
    };
    setAlerts(prev => [...prev, newAlert]);
    handleAddNotification("Alert Created", `Monitoring ${config.ticker} for ${config.type} condition.`);
  };

  const checkAlerts = () => {
    setAlerts(prevAlerts => {
        return prevAlerts.map(alert => {
            if (!alert.active || alert.triggered) return alert;

            const stock = allStocksRef.current.find(s => s.ticker === alert.ticker);
            if (!stock) return alert;

            let triggered = false;

            switch (alert.type) {
                case 'PRICE_ABOVE':
                    if (stock.price > Number(alert.value)) triggered = true;
                    break;
                case 'PRICE_BELOW':
                    if (stock.price < Number(alert.value)) triggered = true;
                    break;
                case 'PERCENT_CHANGE':
                    if (Math.abs(stock.change) > Number(alert.value)) triggered = true;
                    break;
                case 'RISK_CHANGE':
                    if (stock.risk === alert.value) triggered = true;
                    break;
            }

            if (triggered) {
                handleAddNotification(
                    `Alert Triggered: ${stock.ticker}`, 
                    `${stock.ticker} condition met: ${alert.type} ${alert.value}. Current Price: $${stock.price}`,
                    'alert'
                );
                return { ...alert, triggered: true };
            }
            return alert;
        });
    });
  };

  // Check alerts at intervals (not on every WebSocket tick to avoid constant re-renders)
  useEffect(() => {
    if (alerts.length === 0) return;

    // Check immediately on mount or when alerts change
    checkAlerts();

    // Then check every 10 seconds
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [alerts.length]); // Only re-run when alerts are added/removed

  // --- App Logic ---

  const handleAddStock = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    const exists = allStocks.find(s => s.ticker.toLowerCase() === searchTerm.toLowerCase());
    if (exists) {
        showToast(`${exists.ticker} is already in your portfolio.`, 'info');
        return;
    }

    setIsAddingStock(true);
    const newStock = await generateStockData(searchTerm);
    setIsAddingStock(false);

    if (newStock) {
        setAllStocks(prev => [newStock, ...prev]);
        setSearchTerm("");
        showToast(`Successfully tracked ${newStock.ticker}`, 'success');
    } else {
        showToast(`Could not retrieve data for ${searchTerm}. Please try a valid ticker.`, 'error');
    }
  };

  const categories = [
    "All", 
    "AI & Compute", 
    "Quantum",
    "Strategic Materials", 
    "Metals & Mining", 
    "Semi Equip", 
    "Battery & Power",
    "Components",
    "Manufacturing",
    "Other"
  ];

  const highlights = [
    { id: "None", label: "Show All", icon: undefined },
    { id: "Apple Direct", label: "Apple Direct Partners", icon: Cpu },
    { id: "US Reshoring", label: "US Reshoring Plays", icon: Flag },
    { id: "Quantum", label: "Quantum Computing", icon: Zap },
    { id: "Penny Stock", label: "High Volatility / Penny", icon: AlertTriangle },
  ];

  const filteredStocks = useMemo(() => {
    return allStocks.filter(stock => {
      const matchesCategory = filter === "All" || stock.category === filter;
      const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          stock.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesHighlight = true;
      if (highlightFilter !== "None") {
        if (highlightFilter === "Quantum") {
           matchesHighlight = stock.category === "Quantum";
        } else {
           matchesHighlight = stock.tags.includes(highlightFilter);
        }
      }

      return matchesCategory && matchesSearch && matchesHighlight;
    });
  }, [filter, searchTerm, highlightFilter, allStocks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All": allStocks.length };
    allStocks.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [allStocks]);

  const toggleCompare = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.includes(ticker)) {
        return prev.filter(t => t !== ticker);
      }
      if (prev.length >= 4) {
        showToast("Maximum of 4 stocks allowed for comparison", 'error');
        return prev;
      }
      return [...prev, ticker];
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-8 selection:bg-blue-500/30 pb-24 relative overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          
          {/* Dashboard Header */}
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                  Supply Chain <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Intelligence</span>
                  <Globe className="w-8 h-8 text-gray-700" />
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                  Tracking your personal portfolio of the AI & Quantum ecosystem. Powered by Claude.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-gray-900 p-3 rounded-full border border-gray-800 shadow-lg hover:bg-gray-800 hover:border-gray-700 transition-all group"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                </button>

                {/* Alerts Button */}
                <button
                  onClick={() => setIsAlertsPanelOpen(true)}
                  className="relative bg-gray-900 p-3 rounded-full border border-gray-800 shadow-lg hover:bg-gray-800 hover:border-gray-700 transition-all group"
                >
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-gray-900"></span>
                  )}
                </button>

                {/* Refresh Controls */}
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-full border border-gray-800 shadow-lg">
                  {/* WebSocket Status Indicator */}
                  <div className="flex items-center gap-1.5 pr-2 border-r border-gray-700">
                    <div className={`w-2 h-2 rounded-full ${
                      wsState.connected ? 'bg-green-500 animate-pulse' : 
                      wsState.connecting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
                    }`}></div>
                    <span className="text-xs font-medium text-gray-400">
                      {wsState.connected ? 'Live' : wsState.connecting ? 'Connecting...' : 'Offline'}
                    </span>
                  </div>

                  <button
                    onClick={() => manualRefresh()}
                    disabled={finnhubState.isRefreshing}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Refresh Now"
                  >
                    <RefreshCw className={`w-4 h-4 ${finnhubState.isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={toggleAutoRefresh}
                    className={`p-1.5 rounded-lg transition-all ${
                      finnhubState.autoRefreshEnabled
                        ? 'text-emerald-400 hover:bg-emerald-900/30'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                    title={finnhubState.autoRefreshEnabled ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
                  >
                    {finnhubState.autoRefreshEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <div className="h-4 w-px bg-gray-700"></div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${finnhubState.autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
                      {finnhubState.autoRefreshEnabled && (
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {finnhubState.isRefreshing ? (
                        'Updating...'
                      ) : finnhubState.lastRefresh ? (
                        `Updated ${finnhubState.lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                      ) : (
                        'Live Data'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Highlights Dropdown */}
            <div className="mb-6 relative z-40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Intelligence Filters:</span>
                
                <div className="relative">
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm font-medium text-gray-200 hover:bg-gray-800 hover:border-gray-700 transition-all min-w-[260px] justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const active = highlights.find(h => h.id === highlightFilter) || highlights[0];
                        const Icon = active.icon;
                        return (
                          <>
                            {Icon ? <Icon className="w-4 h-4 text-blue-400" /> : <Filter className="w-4 h-4 text-gray-500" />}
                            <span className="text-gray-200">{active.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsFilterDropdownOpen(false)} 
                      />
                      <div className="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                        {highlights.map((hl) => {
                          const Icon = hl.icon;
                          const isActive = highlightFilter === hl.id;
                          return (
                            <button
                              key={hl.id}
                              onClick={() => {
                                setHighlightFilter(hl.id);
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                                isActive 
                                  ? 'bg-blue-600/10 text-blue-400' 
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                              }`}
                            >
                              {Icon ? <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} /> : <div className="w-4 h-4" />}
                              <span>{hl.label}</span>
                              {isActive && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Category & Search Controls */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-900/80 p-2 rounded-2xl border border-gray-800 sticky top-4 z-30 shadow-2xl backdrop-blur-xl">
              
              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilter(cat);
                      setHighlightFilter("None");
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border flex items-center gap-2 ${
                      filter === cat 
                        ? 'bg-gray-800 text-white border-gray-700 shadow-sm' 
                        : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    {cat}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filter === cat ? 'bg-gray-700 text-gray-300' : 'bg-gray-800/50 text-gray-600'}`}>
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Layout */}
              <div className="flex items-center gap-3 w-full xl:w-auto">
                  {/* Layout Toggles */}
                  <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800 shrink-0">
                      <button
                          onClick={() => setLayoutMode('canvas')}
                          className={`p-1.5 rounded-md transition-colors ${layoutMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          title="Canvas View"
                      >
                          <Map className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => setLayoutMode('grid')}
                          className={`p-1.5 rounded-md transition-colors ${layoutMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          title="Grid View"
                      >
                          <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => setLayoutMode('list')}
                          className={`p-1.5 rounded-md transition-colors ${layoutMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          title="List View"
                      >
                          <List className="w-4 h-4" />
                      </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-64 xl:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                          type="text" 
                          placeholder="Search or Add Ticker..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && filteredStocks.length === 0) {
                                  handleAddStock();
                              }
                          }}
                          className="w-full bg-gray-950 border border-gray-700 text-gray-200 pl-10 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-600 text-sm transition-all"
                      />
                      {searchTerm && (
                          <button 
                              onClick={() => setSearchTerm("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
                          >
                              <X className="w-3 h-3" />
                          </button>
                      )}
                  </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          {layoutMode === 'canvas' ? (
            /* Canvas View - Full screen infinite canvas */
            <section className="relative -mx-4 md:-mx-8 -mb-24" style={{ height: 'calc(100vh - 280px)' }}>
              <CanvasApp stocks={allStocks} />
            </section>
          ) : (
          /* Traditional Grid/List Views */
          <div className="space-y-12">

            {/* Public Companies / Watchlist Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  <h2 className="text-2xl font-bold text-gray-100">
                      Tracked Assets
                  </h2>
                  <span className="text-sm font-medium bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md ml-2">{filteredStocks.length}</span>
                </div>
              </div>

              {/* LIST vs GRID RENDERER */}
              {layoutMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredStocks.map((stock) => (
                          <StockCard 
                          key={stock.ticker} 
                          stock={stock} 
                          onClick={setSelectedStock}
                          isSelected={compareList.includes(stock.ticker)}
                          onToggleSelection={(e) => toggleCompare(e, stock.ticker)}
                          hasAlert={alerts.some(a => a.ticker === stock.ticker && !a.triggered)}
                          />
                      ))}
                      {/* SEARCH & ADD CARD (Grid only, helps layout) */}
                      {filteredStocks.length === 0 && searchTerm.length > 1 && (
                          <div className="relative group h-full min-h-[240px]">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse blur"></div>
                              <div 
                                  onClick={!isAddingStock ? handleAddStock : undefined}
                                  className={`relative bg-gray-900 h-full rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-850 transition-colors border border-gray-800 ${isAddingStock ? 'cursor-wait' : ''}`}
                              >
                                  {isAddingStock ? (
                                      <>
                                          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                                          <h3 className="text-lg font-bold text-white mb-2">Analyzing {searchTerm.toUpperCase()}</h3>
                                          <p className="text-xs text-gray-400">Consulting Claude...</p>
                                      </>
                                  ) : (
                                      <>
                                          <div className="bg-blue-500/10 p-4 rounded-full mb-4 group-hover:bg-blue-500/20 transition-colors">
                                              <Sparkles className="w-8 h-8 text-blue-400" />
                                          </div>
                                          <h3 className="text-xl font-bold text-white mb-2">Analyze {searchTerm.toUpperCase()}</h3>
                                          <p className="text-sm text-gray-400 mb-6">
                                              This ticker isn't in your list yet. Use AI to fetch real-time data.
                                          </p>
                                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-blue-500 transition-colors flex items-center gap-2">
                                              <Plus className="w-4 h-4" /> Track Asset
                                          </button>
                                      </>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="space-y-3">
                      {filteredStocks.map((stock) => (
                          <StockRow 
                          key={stock.ticker} 
                          stock={stock} 
                          onClick={setSelectedStock}
                          isSelected={compareList.includes(stock.ticker)}
                          onToggleSelection={(e) => toggleCompare(e, stock.ticker)}
                          />
                      ))}
                      {/* SEARCH & ADD ROW (List view) */}
                      {filteredStocks.length === 0 && searchTerm.length > 1 && (
                          <div className="relative group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse blur"></div>
                              <div 
                                  onClick={!isAddingStock ? handleAddStock : undefined}
                                  className={`relative bg-gray-900 rounded-xl p-8 flex flex-row items-center justify-center text-center cursor-pointer hover:bg-gray-850 transition-colors border border-gray-800 gap-6 ${isAddingStock ? 'cursor-wait' : ''}`}
                              >
                                  {isAddingStock ? (
                                      <>
                                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                          <span className="text-gray-300 font-medium">Analyzing {searchTerm.toUpperCase()} via Claude...</span>
                                      </>
                                  ) : (
                                      <>
                                          <Sparkles className="w-6 h-6 text-blue-400" />
                                          <span className="text-lg font-bold text-white">Ticker {searchTerm.toUpperCase()} not found locally.</span>
                                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 transition-colors flex items-center gap-2">
                                              <Plus className="w-4 h-4" /> Track Asset
                                          </button>
                                      </>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* Market Search Empty */}
              {filteredStocks.length === 0 && searchTerm.length <= 1 && (
                  <div className="text-center py-24 text-gray-500 bg-gray-900/30 rounded-3xl border border-gray-800 border-dashed flex flex-col items-center">
                      <Filter className="w-16 h-16 mb-6 opacity-20 text-gray-400" />
                      <p className="text-lg font-medium mb-2">No assets found matching your criteria.</p>
                      <button 
                      onClick={() => {setFilter("All"); setHighlightFilter("None"); setSearchTerm("");}}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                      Clear all filters
                      </button>
                  </div>
              )}
              
            </section>

            {/* Visual Analysis Section */}
            {filteredStocks.length > 0 && (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <MarketCapChart stocks={filteredStocks} />
                  <CategoryPerformanceChart stocks={filteredStocks} />
              </section>
            )}

            {/* Private / JV Section */}
            {(filter === "All" || filter === "Strategic Materials" || filter === "Manufacturing" || filter === "Quantum") && highlightFilter === "None" && searchTerm === "" && (
              <section className="animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                  <h2 className="text-2xl font-bold text-gray-100">Private Equity & Joint Ventures</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PRIVATE_DATA.map((company) => (
                    <PrivateCompanyCard key={company.name} company={company} />
                  ))}
                </div>
              </section>
            )}

          </div>
          )}

        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' : 
              toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-white' :
              'bg-gray-800/90 border-gray-700 text-white'
          }`}>
              {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : 
              toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-400">i</div>
              }
              <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}

        {/* Comparison Floating Bar */}
        {compareList.length > 0 && !isComparing && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-gray-900 border border-gray-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                  <span className="bg-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">{compareList.length} / 4</span>
                  selected
              </span>
              <div className="h-4 w-px bg-gray-700"></div>
              <button 
                  onClick={() => setCompareList([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                  <X className="w-3 h-3" /> Clear
              </button>
              <button 
                  onClick={() => setIsComparing(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/50"
              >
                  Compare <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
          </div>
        )}

        {/* Comparison Modal */}
        {isComparing && (
          <ComparisonView 
              selectedTickers={compareList}
              allStocks={allStocks}
              onClose={() => setIsComparing(false)}
              onRemove={(t) => setCompareList(prev => prev.filter(x => x !== t))}
          />
        )}

        {/* Detail Modal */}
        {selectedStock && (
          <DetailView 
            stock={selectedStock} 
            onClose={() => setSelectedStock(null)}
            onSetAlert={() => setStockForAlertSetup(selectedStock)} 
          />
        )}

        {/* Alerts Panel */}
        <AlertsPanel
          isOpen={isAlertsPanelOpen}
          onClose={() => setIsAlertsPanelOpen(false)}
          alerts={alerts}
          notifications={notifications}
          onDeleteAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
          onClearNotifications={() => setNotifications([])}
        />

        {/* Alert Setup Modal */}
        {stockForAlertSetup && (
          <AlertSetupModal
            stock={stockForAlertSetup}
            onClose={() => setStockForAlertSetup(null)}
            onSave={handleAddAlert}
          />
        )}

        {/* Global Chat Bot */}
        <ChatBot />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onApiKeyChange={() => {
            // Trigger a refresh after API key changes
            manualRefresh();
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
