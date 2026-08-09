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
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      border: 'border-indigo-100 dark:border-indigo-900',
      iconBg: 'bg-indigo-600 text-white',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900',
      iconBg: 'bg-emerald-600 text-white',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-100 dark:border-amber-900',
      iconBg: 'bg-amber-600 text-white',
      text: 'text-amber-600 dark:text-amber-400'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-100 dark:border-rose-900',
      iconBg: 'bg-rose-600 text-white',
      text: 'text-rose-600 dark:text-rose-400'
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-950/50',
      border: 'border-sky-100 dark:border-sky-900',
      iconBg: 'bg-sky-600 text-white',
      text: 'text-sky-600 dark:text-sky-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      border: 'border-purple-100 dark:border-purple-900',
      iconBg: 'bg-purple-600 text-white',
      text: 'text-purple-600 dark:text-purple-400'
    }
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg glass-card ${currentTheme.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl shadow-xs shrink-0 ${currentTheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>}

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-full ${
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
