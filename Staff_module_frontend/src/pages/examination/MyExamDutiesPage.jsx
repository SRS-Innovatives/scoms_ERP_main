import React from 'react';
import { mockExamDuties } from '../../data/mockStaffData';
import { GraduationCap, Calendar, Clock, MapPin } from 'lucide-react';

export const MyExamDutiesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Exam & Invigilation Duties</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assigned invigilation, paper evaluation, and board exam duties.</p>
        </div>
      </div>

      <div className="space-y-4">
        {mockExamDuties.map((duty) => (
          <div key={duty.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Role: {duty.role}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">{duty.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{duty.class}</p>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-4 h-4 text-sky-500" /> {duty.date}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-4 h-4 text-amber-500" /> {duty.time}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <MapPin className="w-4 h-4 text-rose-500" /> {duty.room}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyExamDutiesPage;
