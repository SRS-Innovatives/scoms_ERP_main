import React from 'react';
import { Clock } from 'lucide-react';

export const SubstituteClassesPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" /> Substitute Teaching Allotment
      </h3>

      <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
        Substitute-teacher allotment is not yet available — your Institute Admin has not enabled this feature for your institution.
      </div>
    </div>
  );
};

export default SubstituteClassesPage;
