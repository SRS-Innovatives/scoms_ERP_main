import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down'
  color = 'indigo' // 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple'
}) => {
  const colorMap = {
    indigo: {
      border: 'border-indigo-100 dark:border-indigo-900/60',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/30',
      glow: 'bg-indigo-400/25',
      ring: 'group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800'
    },
    emerald: {
      border: 'border-emerald-100 dark:border-emerald-900/60',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/30',
      glow: 'bg-emerald-400/25',
      ring: 'group-hover:ring-emerald-200 dark:group-hover:ring-emerald-800'
    },
    amber: {
      border: 'border-amber-100 dark:border-amber-900/60',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-500/30',
      glow: 'bg-amber-400/25',
      ring: 'group-hover:ring-amber-200 dark:group-hover:ring-amber-800'
    },
    rose: {
      border: 'border-rose-100 dark:border-rose-900/60',
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/30',
      glow: 'bg-rose-400/25',
      ring: 'group-hover:ring-rose-200 dark:group-hover:ring-rose-800'
    },
    sky: {
      border: 'border-sky-100 dark:border-sky-900/60',
      iconBg: 'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sky-500/30',
      glow: 'bg-sky-400/25',
      ring: 'group-hover:ring-sky-200 dark:group-hover:ring-sky-800'
    },
    purple: {
      border: 'border-purple-100 dark:border-purple-900/60',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-purple-500/30',
      glow: 'bg-purple-400/25',
      ring: 'group-hover:ring-purple-200 dark:group-hover:ring-purple-800'
    }
  };

  const t = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`group relative overflow-hidden p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ring-1 ring-transparent ${t.ring} ${t.border}`}
    >
      {/* Ambient glow accent, top-right */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${t.glow}`} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {title}
          </p>
          <h3 className="text-[26px] leading-tight font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl shadow-lg shrink-0 ${t.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              trendType === 'up'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
            }`}
          >
            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
