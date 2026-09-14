import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// One sequential hue per card, picked from the platform's categorical slots so each
// metric reads as its own identity at a glance — never cycled arbitrarily, assigned
// once per call site. Light/dark bar-fill stops + accent tokens come straight off the
// validated ramps (see dataviz skill palette reference).
const THEMES = {
  indigo: {
    barClass: 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300',
    trackClass: 'bg-indigo-50 dark:bg-slate-800',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
  },
  amber: {
    barClass: 'bg-gradient-to-t from-amber-600 to-amber-400 dark:from-amber-500 dark:to-amber-300',
    trackClass: 'bg-amber-50 dark:bg-slate-800',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  emerald: {
    barClass: 'bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300',
    trackClass: 'bg-emerald-50 dark:bg-slate-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  violet: {
    barClass: 'bg-gradient-to-t from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300',
    trackClass: 'bg-violet-50 dark:bg-slate-800',
    textClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    dotClass: 'bg-violet-500',
  },
};

const formatValue = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v.toLocaleString());

export const ChartCard = ({ title, subtitle, data = [], height = 200, color = 'indigo', showTrend = true }) => {
  const theme = THEMES[color] || THEMES.indigo;
  const chartData = data.length > 0 ? data : [
    { label: 'Jan', value: 35 },
    { label: 'Feb', value: 48 },
    { label: 'Mar', value: 62 },
    { label: 'Apr', value: 75 },
    { label: 'May', value: 89 },
    { label: 'Jun', value: 110 },
  ];

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const allZero = chartData.every((d) => d.value === 0);

  // Real trend: last value vs. the one before it, computed from the actual data passed
  // in — never a fabricated percentage.
  const last = chartData[chartData.length - 1]?.value ?? 0;
  const prev = chartData[chartData.length - 2]?.value ?? null;
  const trendPct = showTrend && prev !== null && prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

  const [grown, setGrown] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(null);
  const dataKey = chartData.map((d) => `${d.label}:${d.value}`).join('|');
  useEffect(() => {
    setGrown(false);
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, [dataKey]);

  // 4 gridlines (0%, 33%, 66%, 100%) referencing the real max value.
  const gridSteps = [0, 1 / 3, 2 / 3, 1];

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {trendPct !== null && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${
              trendPct > 0 ? 'text-emerald-600 dark:text-emerald-400' : trendPct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
            }`}>
              {trendPct > 0 ? <TrendingUp className="w-3 h-3" /> : trendPct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trendPct > 0 ? '+' : ''}{trendPct}%
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${theme.badgeClass}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.dotClass} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.dotClass}`} />
            </span>
            Live
          </span>
        </div>
      </div>

      <div className="relative w-full mt-4" style={{ height: `${height}px` }}>
        {/* Gridlines, referencing the real max value — bottom-6 matches the bars'
            container exactly (pb-6) so the baseline lines up with the x-axis. */}
        <div className="absolute inset-x-0 top-0 bottom-6">
          {gridSteps.map((g) => (
            <div
              key={g}
              className="absolute inset-x-0 border-t border-dashed border-slate-200 dark:border-slate-800"
              style={{ bottom: `${g * 100}%` }}
            >
              <span className="absolute -top-2.5 right-0 text-[9px] font-mono text-slate-300 dark:text-slate-700 bg-white dark:bg-slate-900 pl-1">
                {g === 0 ? '0' : formatValue(Math.round(maxVal * g))}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-end justify-between gap-2 pb-6">
          {chartData.map((item, idx) => {
            const hPct = allZero ? 0 : (item.value / maxVal) * 100;
            const isHovered = hoverIdx === idx;
            return (
              <div
                key={item.label ?? idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {/* Hover column highlight */}
                <div className={`absolute inset-y-0 inset-x-0 rounded-lg transition-colors ${isHovered ? 'bg-slate-900/[0.03] dark:bg-white/[0.04]' : ''}`} />

                {/* Always-visible value label */}
                <span
                  className={`relative z-10 text-[10px] font-bold tabular-nums mb-1 transition-colors ${
                    isHovered ? theme.textClass : 'text-slate-400 dark:text-slate-500'
                  } ${item.value === 0 ? 'opacity-40' : ''}`}
                >
                  {formatValue(item.value)}
                </span>

                <div className={`relative w-full max-w-[30px] rounded-t-[4px] overflow-hidden flex items-end h-full ${theme.trackClass}`}>
                  <div
                    className={`w-full rounded-t-[4px] transition-[height] ease-out ${theme.barClass} ${isHovered ? 'brightness-110 shadow-lg' : ''}`}
                    style={{
                      height: grown ? `${Math.max(hPct, item.value > 0 ? 3 : 0)}%` : '0%',
                      transitionDuration: '700ms',
                      transitionDelay: `${idx * 60}ms`,
                    }}
                  />
                </div>

                <span className={`relative z-10 text-[11px] font-semibold mt-2 transition-colors ${isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {allZero && (
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 -mt-2">No activity recorded in this period yet</p>
      )}
    </div>
  );
};

export default ChartCard;
