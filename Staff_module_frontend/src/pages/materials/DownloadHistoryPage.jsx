import React from 'react';
import { Download } from 'lucide-react';

export const DownloadHistoryPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Download className="w-5 h-5 text-sky-500" /> Student Material Download Activity Log
      </h3>
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span>Aarav Patel downloaded <strong>Unit 3 Wave Optics Notes</strong></span>
          <span className="text-slate-400">10-Aug-2026 04:12 PM</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span>Ananya Sen downloaded <strong>Electrostatics Mindmaps</strong></span>
          <span className="text-slate-400">10-Aug-2026 02:45 PM</span>
        </div>
      </div>
    </div>
  );
};

export default DownloadHistoryPage;
