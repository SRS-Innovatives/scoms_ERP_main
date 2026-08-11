import React from 'react';

export const ChartCard = ({ title, subtitle, data = [], height = 180 }) => {
  const chartData = data.length > 0 ? data : [
    { label: 'Sem 1', value: 8.2 },
    { label: 'Sem 2', value: 8.5 },
    { label: 'Sem 3', value: 8.7 },
    { label: 'Sem 4', value: 8.92 }
  ];

  const maxVal = Math.max(...chartData.map(d => d.value)) || 10;

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-end justify-between gap-3 pt-6 pb-6">
          {chartData.map((item, idx) => {
            const hPct = (item.value / maxVal) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none z-10 font-bold shadow">
                  {item.value}
                </div>

                <div className="w-full max-w-[32px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-110"
                    style={{ height: `${hPct}%` }}
                  ></div>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
