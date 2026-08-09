import React, { useState } from 'react';
import { Calendar, User } from 'lucide-react';
import { staffList } from '../../data/mockData';

export const TeacherTimetablePage = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(staffList[0].name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Individual Workload & Timetable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Teaching hours per week, assigned classes, lab sessions & free periods</p>
        </div>

        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-semibold">
          {staffList.map((s) => (
            <option key={s.id} value={s.name}>{s.name} ({s.dept})</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-xs text-xs space-y-4">
        <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100">
          <User className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{selectedTeacher}</p>
            <p className="text-slate-500">Total Teaching Workload: <span className="font-mono font-bold text-indigo-600">16 Hours / Week</span> (12 Theory + 4 Lab)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetablePage;
