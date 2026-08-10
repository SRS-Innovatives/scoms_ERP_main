import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

export const SubstituteClassesPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" /> Substitute Teaching Allotment
      </h3>

      <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex justify-between items-center">
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Period 4 (11:05 AM) • Class 9-B Physics</span>
          <p className="text-slate-500 mt-0.5">Substituted for Prof. V. K. Menon (On Leave)</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">Assigned Today</span>
      </div>
    </div>
  );
};

export default SubstituteClassesPage;
