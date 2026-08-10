import React from 'react';

export const LoadingState = ({ message = 'Loading platform data...' }) => {
  return (
    <div className="glass-card p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center my-6 space-y-3">
      <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
};

export default LoadingState;
