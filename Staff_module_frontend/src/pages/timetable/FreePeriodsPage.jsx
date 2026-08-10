import React from 'react';
import { Clock } from 'lucide-react';

export const FreePeriodsPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-500" /> Free & Non-Teaching Periods Today
      </h3>
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex justify-between font-semibold">
          <span>Period 4 (11:05 AM - 11:50 AM)</span>
          <span>Staff Room / Evaluation</span>
        </div>
      </div>
    </div>
  );
};

export default FreePeriodsPage;
