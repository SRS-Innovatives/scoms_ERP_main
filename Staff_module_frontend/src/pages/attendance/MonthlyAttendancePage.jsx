import React from 'react';
import { Calendar } from 'lucide-react';

export const MonthlyAttendancePage = () => {
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-500" /> Monthly Class Attendance Grid (August 2026)
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 border border-slate-200 dark:border-slate-700">Student</th>
              {daysInMonth.slice(0, 15).map(d => (
                <th key={d} className="p-1 text-center border border-slate-200 dark:border-slate-700 font-bold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-2 font-bold text-slate-900 dark:text-slate-100">Aarav Patel</td>
              {daysInMonth.slice(0, 15).map(d => (
                <td key={d} className="p-1 text-center font-bold text-emerald-600">P</td>
              ))}
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <td className="p-2 font-bold text-slate-900 dark:text-slate-100">Rohan Verma</td>
              {daysInMonth.slice(0, 15).map(d => (
                <td key={d} className={`p-1 text-center font-bold ${d === 11 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {d === 11 ? 'A' : 'P'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyAttendancePage;
