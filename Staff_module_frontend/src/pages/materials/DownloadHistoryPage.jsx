import React from 'react';
import { Download } from 'lucide-react';

export const DownloadHistoryPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Download className="w-5 h-5 text-sky-500" /> Student Material Download Activity Log
      </h3>
      <p className="text-xs text-slate-500 text-center py-8">
        Per-student download tracking is not yet available — this requires instrumentation on the Student portal that hasn't been built yet.
      </p>
    </div>
  );
};

export default DownloadHistoryPage;
