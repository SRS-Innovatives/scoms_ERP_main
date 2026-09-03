import React from 'react';
import * as Icons from 'lucide-react';
import { FileBarChart } from 'lucide-react';

export const ReportCard = ({ report, onClick }) => {
  const Icon = Icons[report.icon] || FileBarChart;
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {report.category}
        </span>
      </div>
      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{report.name}</h4>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{report.description}</p>
    </button>
  );
};

export default ReportCard;
