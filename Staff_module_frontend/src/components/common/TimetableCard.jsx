import React from 'react';
import { Clock, MapPin, BookOpen, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const TimetableCard = ({ schedule }) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        schedule.isCurrent
          ? 'bg-sky-50/90 dark:bg-sky-950/70 border-sky-400 dark:border-sky-500 shadow-md ring-2 ring-sky-500/20'
          : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {schedule.time}
        </span>
        <StatusBadge status={schedule.status} size="sm" />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            {schedule.subject}
          </h4>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
            {schedule.class} ({schedule.period})
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3 h-3 text-rose-500" />
            {schedule.room}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimetableCard;
