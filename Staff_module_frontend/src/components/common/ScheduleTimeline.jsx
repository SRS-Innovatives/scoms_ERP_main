import React from 'react';
import TimetableCard from './TimetableCard';
import { Calendar } from 'lucide-react';

export const ScheduleTimeline = ({ schedules = [] }) => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Today's Schedule Timeline
        </h4>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-3">
        {schedules.map((schedule, idx) => (
          <TimetableCard key={idx} schedule={schedule} />
        ))}
      </div>
    </div>
  );
};

export default ScheduleTimeline;
