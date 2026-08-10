import React from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';

export const SubjectMappingPage = () => {
  const mappings = [
    { class: "Class 10-A", subject: "Physics (Core)", periodsPerWeek: 4, type: "Theory" },
    { class: "Class 11-B", subject: "Applied Physics", periodsPerWeek: 5, type: "Theory + Lab" },
    { class: "Class 12-A", subject: "Advanced Physics & Quantum Physics", periodsPerWeek: 6, type: "Theory" },
    { class: "Class 12-A Lab", subject: "Physics Practicals & Ray Optics", periodsPerWeek: 4, type: "Practical Lab" }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Subject & Class Allocation Mapping
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Class Name</th>
              <th className="p-3">Subject Name</th>
              <th className="p-3">Periods per Week</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mappings.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{m.class}</td>
                <td className="p-3 text-slate-800 dark:text-slate-200">{m.subject}</td>
                <td className="p-3 font-semibold">{m.periodsPerWeek} Periods</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-medium">{m.type}</span></td>
                <td className="p-3 text-right"><span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1"><CheckCircle className="w-3.5 h-3.5" /> Allocated</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectMappingPage;
