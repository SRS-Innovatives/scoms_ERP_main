import React, { useState } from 'react';
import { mockStudentsList } from '../../data/mockStaffData';
import { useNotification } from '../../context/NotificationContext';
import { Save, CheckCircle } from 'lucide-react';

export const MarksEntryPage = () => {
  const { success } = useNotification();
  const [marksState, setMarksState] = useState(() => {
    const initial = {};
    mockStudentsList.forEach(s => { initial[s.id] = s.lastMarks; });
    return initial;
  });

  const handleSave = () => {
    success('Marks entry saved cleanly to examination database!', 'Marks Saved');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Examination Marks Entry Portal</h3>
          <p className="text-xs text-slate-500">Class: Class 12-A • Exam: Mid-Term Physics • Max Marks: 100</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
          <Save className="w-4 h-4" /> Save Marks Log
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Class</th>
              <th className="p-3">Marks Obtained (Out of 100)</th>
              <th className="p-3">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {mockStudentsList.map((s) => {
              const val = marksState[s.id] || 0;
              const grade = val >= 90 ? 'A+' : val >= 80 ? 'A' : val >= 70 ? 'B' : val >= 50 ? 'C' : 'F';
              return (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold">{s.rollNo}</td>
                  <td className="p-3 font-semibold">{s.name}</td>
                  <td className="p-3 text-slate-500">{s.class}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      max={100}
                      min={0}
                      value={val}
                      onChange={(e) => setMarksState({ ...marksState, [s.id]: e.target.value })}
                      className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </td>
                  <td className="p-3 font-bold text-sky-600">{grade}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksEntryPage;
