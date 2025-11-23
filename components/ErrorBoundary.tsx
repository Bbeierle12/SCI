import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">System Encountered an Error</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Our intelligence dashboard encountered an unexpected issue. The error has been logged for review.
            </p>
            
            {this.state.error && (
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 mb-6 text-left overflow-auto max-h-32 custom-scrollbar shadow-inner">
                    <code className="text-xs text-red-400 font-mono break-words">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}

            <button
              onClick={this.handleRefresh}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-900/30"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}