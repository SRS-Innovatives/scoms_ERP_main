import React from 'react';

export const PerformanceChart = ({ title, type = 'bar', data = [], height = 200, periodLabel = 'This Week' }) => {
  // SVG based chart component for zero-dependency high visual appeal.
  // No fake fallback data — an empty `data` array renders a real empty state.
  const maxValue = 100;

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
          {periodLabel}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center text-xs text-slate-400" style={{ height: `${height}px` }}>
          No data available yet.
        </div>
      ) : (
      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Chart Bars */}
        <div className="absolute inset-0 flex items-end justify-between gap-2 pt-6 pb-6">
          {data.map((item, idx) => {
            const heightPercent = (item.value / maxValue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none z-10 font-semibold shadow">
                  {item.value}%
                </div>

                {/* Bar */}
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-sky-600 to-sky-400 dark:from-sky-500 dark:to-sky-300 rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                </div>

                {/* Label */}
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};

export default PerformanceChart;
