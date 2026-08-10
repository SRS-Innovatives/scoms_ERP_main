import React from 'react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const getBadgeStyle = (val) => {
    const s = String(val).toLowerCase();
    if (['active', 'paid', 'healthy', 'delivered', 'verified', 'success', 'connected', 'approved', 'resolved'].includes(s)) {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (['suspended', 'failed', 'down', 'expired', 'rejected', 'overdue', 'cancelled', 'deleted'].includes(s)) {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (['trial', 'pending', 'warning', 'in progress', 'evaluating'].includes(s)) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (['open', 'upcoming', 'issued', 'submitted', 'new'].includes(s)) {
      return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
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
