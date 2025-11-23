
import React, { useState } from 'react';
import { Bell, Check, X, AlertCircle } from 'lucide-react';
import { Stock, AlertType, AlertConfig } from '../types';

interface AlertSetupModalProps {
  stock: Stock;
  onClose: () => void;
  onSave: (config: Omit<AlertConfig, 'id' | 'active' | 'triggered'>) => void;
}

export const AlertSetupModal: React.FC<AlertSetupModalProps> = ({ stock, onClose, onSave }) => {
  const [type, setType] = useState<AlertType>('PRICE_ABOVE');
  const [value, setValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation Logic
    if (type === 'RISK_CHANGE') {
      if (!value) {
        setError("Please select a valid risk level.");
        return;
      }
    } else {
      // Numeric checks for PRICE and PERCENT types
      if (!value || isNaN(Number(value))) {
        setError("Please enter a valid number.");
        return;
      }
      if (Number(value) < 0) {
        setError("Value must be a positive number.");
        return;
      }
    }

    onSave({
      ticker: stock.ticker,
      type,
      value: type === 'RISK_CHANGE' ? value : Number(value)
    });
    onClose();
  };

  const handleTypeChange = (newType: AlertType) => {
    setType(newType);
    setValue('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Set Alert</h3>
              <p className="text-xs text-gray-400">Configure intelligence triggers for {stock.ticker}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Trigger Condition</label>
            <select 
              value={type} 
              onChange={(e) => handleTypeChange(e.target.value as AlertType)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="PRICE_ABOVE">Price Goes Above ($)</option>
              <option value="PRICE_BELOW">Price Drops Below ($)</option>
              <option value="PERCENT_CHANGE">Daily Change Exceeds (%)</option>
              <option value="RISK_CHANGE">Risk Level Matches</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {type === 'RISK_CHANGE' ? 'Risk Level' : 'Threshold Value'}
            </label>
            
            {type === 'RISK_CHANGE' ? (
              <select
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:outline-none transition-all ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'}`}
              >
                <option value="" disabled>Select Risk Level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Extreme">Extreme</option>
              </select>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  placeholder={type === 'PERCENT_CHANGE' ? "e.g. 5" : stock.price.toString()}
                  className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:outline-none transition-all pl-4 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'}`}
                />
                {type === 'PERCENT_CHANGE' && (
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                )}
                {(type === 'PRICE_ABOVE' || type === 'PRICE_BELOW') && (
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-xs animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
