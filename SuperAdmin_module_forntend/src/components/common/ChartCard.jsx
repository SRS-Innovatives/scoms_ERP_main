import React, { useEffect, useRef, useState } from 'react';

export const ChartCard = ({ title, subtitle, data = [], height = 200, color = 'indigo' }) => {
  const chartData = data.length > 0 ? data : [
    { label: 'Jan', value: 35 },
    { label: 'Feb', value: 48 },
    { label: 'Mar', value: 62 },
    { label: 'Apr', value: 75 },
    { label: 'May', value: 89 },
    { label: 'Jun', value: 110 }
  ];

  const maxVal = Math.max(...chartData.map(d => d.value)) || 100;

  // Bars render at 0 height first render, then grow to their real height — without this
  // extra tick the CSS transition has no "before" state to animate from, so nothing moves.
  const [grown, setGrown] = useState(false);
  const dataKey = chartData.map((d) => `${d.label}:${d.value}`).join('|');
  useEffect(() => {
    setGrown(false);
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, [dataKey]);

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
          </span>
          Live Metric
        </span>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-end justify-between gap-2 pt-6 pb-6">
          {chartData.map((item, idx) => {
            const hPct = (item.value / maxVal) * 100;
            return (
              <div key={item.label ?? idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none z-10 font-bold shadow">
                  {item.value}
                </div>

                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 rounded-t-lg transition-[height] ease-out group-hover:brightness-110"
                    style={{
                      height: grown ? `${hPct}%` : '0%',
                      transitionDuration: '700ms',
                      transitionDelay: `${idx * 60}ms`,
                    }}
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
