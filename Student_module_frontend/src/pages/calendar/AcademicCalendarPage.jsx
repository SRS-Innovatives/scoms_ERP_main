import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Calendar as CalendarIcon } from 'lucide-react';

export const AcademicCalendarPage = () => {
  const events = [
    { date: "2026-08-15", title: "Independence Day Holiday" },
    { date: "2026-08-25", title: "Mid-Semester Internal Exams Begin" },
    { date: "2026-08-31", title: "Fee Payment Deadline" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Calendar FY 2026" subtitle="College holidays, examination schedules, and event milestones." />

      <div className="space-y-3">
        {events.map((e, idx) => (
          <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{e.title}</h4>
              <p className="text-[11px] text-slate-400">{e.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicCalendarPage;
