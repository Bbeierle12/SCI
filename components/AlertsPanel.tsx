
import React, { useState } from 'react';
import { Bell, X, Trash2, CheckCircle2, BellOff, BellRing, History } from 'lucide-react';
import { AlertConfig, AppNotification } from '../types';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertConfig[];
  notifications: AppNotification[];
  onDeleteAlert: (id: string) => void;
  onClearNotifications: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  isOpen,
  onClose,
  alerts,
  notifications,
  onDeleteAlert,
  onClearNotifications
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts');

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[55] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm">
        <h2 className="font-bold text-white text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          Intelligence Center
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-gray-400 hover:text-white'}`}
        >
          Active Triggers ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-gray-400 hover:text-white'}`}
        >
          History ({notifications.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-120px)] custom-scrollbar">
        
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BellOff className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No active alerts configured.</p>
                <p className="text-xs mt-1">Set alerts from any stock detail view.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex justify-between items-center group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{alert.ticker}</span>
                      {alert.triggered && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded">Triggered</span>}
                    </div>
                    <div className="text-sm text-gray-400">
                      {alert.type === 'PRICE_ABOVE' && `Price > $${alert.value}`}
                      {alert.type === 'PRICE_BELOW' && `Price < $${alert.value}`}
                      {alert.type === 'PERCENT_CHANGE' && `Change > ${alert.value}%`}
                      {alert.type === 'RISK_CHANGE' && `Risk matches "${alert.value}"`}
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-gray-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recent notifications.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                   <button onClick={onClearNotifications} className="text-xs text-blue-400 hover:text-blue-300">Clear All</button>
                </div>
                {notifications.map(note => (
                  <div key={note.id} className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 relative">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-1.5 rounded-full ${note.type === 'alert' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                         {note.type === 'alert' ? <BellRing className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-200">{note.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{note.message}</p>
                        <span className="text-[10px] text-gray-600 mt-2 block">
                          {new Date(note.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {!note.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
