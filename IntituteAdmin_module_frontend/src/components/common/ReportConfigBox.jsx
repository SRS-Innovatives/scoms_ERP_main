import React from 'react';

/** A labeled, bordered config group — echoes the classic "fieldset" grouping style
 * used across report-builder tools (Class/View/Colors/Filters boxes), rebuilt with
 * our own design system. Purely a layout shell; no logic. */
export const ReportConfigBox = ({ title, children, className = '' }) => (
  <div className={`glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 ${className}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2">
      {title}
    </h3>
    <div className="space-y-2.5 text-xs">{children}</div>
  </div>
);

export const ReportCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
    />
    {label}
  </label>
);

export default ReportConfigBox;
