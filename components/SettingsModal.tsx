import React, { useState, useEffect } from 'react';
import { Settings, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../services/apiClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange?: () => void;
}

interface KeyStatus {
  hasKey: boolean;
  maskedKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing key status on mount
  useEffect(() => {
    if (isOpen) {
      loadKeyStatus();
    }
  }, [isOpen]);

  const loadKeyStatus = async () => {
    try {
      const result = await apiGet<KeyStatus>('/api/config/finnhub-key');
      setHasExistingKey(result.hasKey);
      setMaskedKey(result.maskedKey);
    } catch (e) {
      console.error('Failed to load key status:', e);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const result = await apiPost<{ success: boolean; error?: string }>('/api/config/finnhub-key', {
        apiKey: apiKey.trim()
      });
      if (result.success) {
        setSaveStatus('success');
        setApiKey('');
        await loadKeyStatus();
        onApiKeyChange?.();
        // Auto-close after success
        setTimeout(() => {
          onClose();
          setSaveStatus('idle');
        }, 1500);
      } else {
        setSaveStatus('error');
        setErrorMessage(result.error || 'Failed to save');
      }
    } catch (e) {
      setSaveStatus('error');
      setErrorMessage('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      await apiDelete('/api/config/finnhub-key');
      setHasExistingKey(false);
      setMaskedKey('');
      onApiKeyChange?.();
    } catch (e) {
      console.error('Failed to clear key:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Finnhub API Key Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Finnhub API Key</h3>
            </div>

            {/* Current Key Status */}
            {hasExistingKey && (
              <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">API Key configured</span>
                  <span className="text-xs text-gray-500 font-mono">{maskedKey}</span>
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Input Field */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasExistingKey ? 'Enter new key to replace...' : 'Enter your Finnhub API key...'}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-sm font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || isSaving}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  saveStatus === 'success'
                    ? 'bg-emerald-600 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    {errorMessage}
                  </>
                ) : (
                  'Save API Key'
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-2">
                Get a free API key from Finnhub to enable real-time stock data, news, and financial metrics.
              </p>
              <a
                href="https://finnhub.io/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Get your free API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
