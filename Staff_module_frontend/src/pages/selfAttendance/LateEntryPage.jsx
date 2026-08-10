import React from 'react';
import { Clock } from 'lucide-react';

export const LateEntryPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" /> Late Entry Punch Log
      </h3>
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs flex justify-between font-semibold">
        <span>08-Aug-2026 • Punch In: 08:42 AM (Grace period 15 mins exceeded by 2 mins)</span>
        <span className="text-amber-700">Regularized</span>
      </div>
    </div>
  );
};

export default LateEntryPage;
