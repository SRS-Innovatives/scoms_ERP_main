import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, MinusCircle } from 'lucide-react';

export const StatusBadge = ({ status, text }) => {
  const label = text || status;
  const s = String(status || '').toLowerCase();

  if (s === 'paid' || s === 'active' || s === 'completed' || s === 'approved' || s === 'success' || s === 'present') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        {label}
      </span>
    );
  }

  if (s === 'pending' || s === 'partial' || s === 'processing' || s === 'in progress' || s === 'late' || s === 'issued / unpaid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        {label}
      </span>
    );
  }

  if (s === 'absent' || s === 'rejected' || s === 'overdue' || s === 'failed' || s === 'unpaid' || s === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <MinusCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      {label}
    </span>
  );
};

export default StatusBadge;
