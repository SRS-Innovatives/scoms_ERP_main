import React from 'react';
import { TrendingUp, BarChart2, PieChart as PieIcon } from 'lucide-react';

export const ChartCard = ({ title, subtitle, type = 'bar', data = [], height = 220 }) => {
  if (type === 'bar') {
    const maxVal = Math.max(...data.map((d) => d.amount || d.value || 100));

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Sync
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 pt-6" style={{ height: `${height}px` }}>
          {data.map((item, idx) => {
            const val = item.amount || item.value || 0;
            const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-1.5 py-0.5 rounded -mb-1 z-10 whitespace-nowrap">
                  ₹{(val / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full max-w-[36px] bg-linear-to-t from-indigo-600 to-indigo-400 dark:from-indigo-700 dark:to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-xs"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">
                  {item.month || item.label || item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="relative pt-4 flex flex-col justify-between" style={{ height: `${height}px` }}>
          <div className="flex items-end justify-between h-40 gap-3 px-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {data.map((item, idx) => {
              const rate = item.rate || item.value || 90;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div
                    className="w-3 rounded-full bg-emerald-500 transition-all duration-300 group-hover:scale-125"
                    style={{ height: `${rate - 40}%` }}
                  />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-2">{item.day}</span>
                  <span className="text-[9px] text-slate-400 font-bold">{rate}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'pie' || type === 'donut') {
    const total = data.reduce((acc, curr) => acc + (curr.count || curr.amount || 0), 0);
    const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs glass-card">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="space-y-3 pt-2">
          {data.map((item, idx) => {
            const val = item.count || item.amount || 0;
            const pct = total ? Math.round((val / total) * 100) : 0;
            const colorBg = colors[idx % colors.length];

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name || item.category}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {val.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colorBg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default ChartCard;
