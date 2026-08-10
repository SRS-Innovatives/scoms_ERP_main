import React from 'react';
import { mockWeeklyTimetable } from '../../data/mockStaffData';
import { Calendar } from 'lucide-react';

export const WeeklyTimetablePage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-500" /> Weekly Master Teaching Schedule
          </h3>
          <p className="text-xs text-slate-500">Dr. Rajesh Sharma • Department of Physics</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border border-slate-200 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-700 dark:text-slate-300">
            <tr>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Time / Day</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Monday</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Tuesday</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Wednesday</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Thursday</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Friday</th>
              <th className="p-3 border border-slate-200 dark:border-slate-700">Saturday</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold">
            {mockWeeklyTimetable.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold">{row.time}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.mon}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.tue}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.wed}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.thu}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.fri}</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">{row.sat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyTimetablePage;
