import React from 'react';
import { Award, Calendar } from 'lucide-react';

export const EventDutiesPage = () => {
  const events = [
    { title: "Annual Inter-School Science Fair 2026", role: "Chief Coordinator & Judge", date: "2026-09-05", venue: "Auditorium Hall" },
    { title: "Independence Day Cultural Parade", role: "Discipline In-charge", date: "2026-08-15", venue: "College Grounds" }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-500" /> Event & Co-Curricular Duties Allotment
      </h3>

      <div className="space-y-3">
        {events.map((e, idx) => (
          <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-sky-600">Role: {e.role}</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{e.title}</h4>
              <p className="text-slate-500">Venue: {e.venue}</p>
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{e.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDutiesPage;
