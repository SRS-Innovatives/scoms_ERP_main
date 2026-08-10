import React from 'react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const getBadgeStyle = (val) => {
    const s = String(val).toLowerCase();
    if (['present', 'completed', 'verified', 'approved', 'evaluated', 'active', 'good', 'excellent'].includes(s)) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (['absent', 'rejected', 'defective', 'overdue', 'pending'].includes(s)) {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (['late', 'evaluating', 'in progress', 'warning'].includes(s)) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (['on duty', 'upcoming', 'issued', 'submitted'].includes(s)) {
      return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${getBadgeStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
