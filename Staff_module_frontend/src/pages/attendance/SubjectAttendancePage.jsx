import React from 'react';
import { BookOpen, Percent } from 'lucide-react';

export const SubjectAttendancePage = () => {
  const subjects = [
    { name: "Class 12-A Physics Theory", taken: 34, total: 36, percentage: "94.4%" },
    { name: "Class 12-A Physics Lab", taken: 18, total: 18, percentage: "100%" },
    { name: "Class 11-B Applied Physics", taken: 28, total: 30, percentage: "93.3%" },
    { name: "Class 10-A Physics Core", taken: 30, total: 32, percentage: "93.7%" }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Subject-wise Attendance Statistics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((sub, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{sub.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Classes Conducted: {sub.taken} / {sub.total}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{sub.percentage}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectAttendancePage;
