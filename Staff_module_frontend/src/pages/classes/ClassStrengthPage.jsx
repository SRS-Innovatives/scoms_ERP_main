import React from 'react';
import { Users, PieChart } from 'lucide-react';

export const ClassStrengthPage = () => {
  const strengths = [
    { class: "Class 10-A", boys: 22, girls: 20, total: 42, avgAttendance: "92%" },
    { class: "Class 11-B", boys: 20, girls: 18, total: 38, avgAttendance: "88%" },
    { class: "Class 12-A", boys: 21, girls: 19, total: 40, avgAttendance: "94%" }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" /> Class Strength & Demographics Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strengths.map((s, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{s.class}</h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Total Strength:</span><span className="font-bold">{s.total}</span></div>
              <div className="flex justify-between"><span>Boys:</span><span>{s.boys}</span></div>
              <div className="flex justify-between"><span>Girls:</span><span>{s.girls}</span></div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-semibold text-sky-600 dark:text-sky-400">
                <span>Avg Attendance:</span><span>{s.avgAttendance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassStrengthPage;
