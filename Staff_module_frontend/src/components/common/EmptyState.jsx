import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No Data Found', message = 'There are no items matching your criteria.', icon: Icon = Inbox, actionLabel, onAction }) => {
  return (
    <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center my-6">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
