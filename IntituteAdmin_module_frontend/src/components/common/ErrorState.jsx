import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ title = 'Failed to load data', message = 'An unexpected error occurred while fetching information.', onRetry }) => {
  return (
    <div className="glass-card p-10 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center flex flex-col items-center justify-center my-6">
      <div className="p-3.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 mb-3">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-rose-900 dark:text-rose-100">{title}</h4>
      <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
