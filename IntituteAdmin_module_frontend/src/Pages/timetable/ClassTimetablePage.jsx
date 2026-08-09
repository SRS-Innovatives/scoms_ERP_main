import React, { useState } from 'react';
import { Calendar, Clock, Printer } from 'lucide-react';

export const ClassTimetablePage = () => {
  const [selectedClass, setSelectedClass] = useState('3rd Year CSE - Sec A');

  const timetable = [
    { day: 'Monday', h1: 'CS8601 (Mobile Comp)', h2: 'CS8602 (Compiler Des)', h3: 'CS8603 (AI)', h4: 'Library', h5: 'CS8691 Lab', h6: 'CS8691 Lab' },
    { day: 'Tuesday', h1: 'CS8602 (Compiler Des)', h2: 'CS8603 (AI)', h3: 'CS8601 (Mobile Comp)', h4: 'Sports / Gym', h5: 'Value Education', h6: 'Placement Aptitude' },
    { day: 'Wednesday', h1: 'CS8603 (AI)', h2: 'CS8601 (Mobile Comp)', h3: 'CS8602 (Compiler Des)', h4: 'Seminar', h5: 'Advanced Coding Lab', h6: 'Advanced Coding Lab' },
    { day: 'Thursday', h1: 'CS8601 (Mobile Comp)', h2: 'CS8602 (Compiler Des)', h3: 'CS8603 (AI)', h4: 'Mentoring', h5: 'IoT Project Lab', h6: 'IoT Project Lab' },
    { day: 'Friday', h1: 'CS8602 (Compiler Des)', h2: 'CS8603 (AI)', h3: 'CS8601 (Mobile Comp)', h4: 'Library', h5: 'Mini Project', h6: 'Mini Project' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Class Timetable Grid</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Weekly course schedule, hour-wise lecture slots & lab session mapping</p>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-semibold">
            <option value="3rd Year CSE - Sec A">3rd Year CSE - Sec A</option>
            <option value="3rd Year AI&DS - Sec B">3rd Year AI&DS - Sec B</option>
            <option value="2nd Year ECE - Sec A">2nd Year ECE - Sec A</option>
          </select>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
            <Printer className="w-4 h-4" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px]">
                <th className="p-3 border-r text-left w-28">Day / Time</th>
                <th className="p-3 border-r">Hour 1<br /><span className="text-[9px] font-normal text-slate-400">08:45 - 09:40</span></th>
                <th className="p-3 border-r">Hour 2<br /><span className="text-[9px] font-normal text-slate-400">09:40 - 10:35</span></th>
                <th className="p-3 border-r">Hour 3<br /><span className="text-[9px] font-normal text-slate-400">10:45 - 11:40</span></th>
                <th className="p-3 border-r">Hour 4<br /><span className="text-[9px] font-normal text-slate-400">11:40 - 12:35</span></th>
                <th className="p-3 border-r bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">LUNCH BREAK<br /><span className="text-[9px] font-normal">12:35 - 01:30</span></th>
                <th className="p-3 border-r">Hour 5<br /><span className="text-[9px] font-normal text-slate-400">01:30 - 02:25</span></th>
                <th className="p-3">Hour 6<br /><span className="text-[9px] font-normal text-slate-400">02:25 - 03:20</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {timetable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 border-r font-bold text-left text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">{row.day}</td>
                  <td className="p-3 border-r font-semibold text-indigo-600 dark:text-indigo-400">{row.h1}</td>
                  <td className="p-3 border-r font-semibold text-purple-600">{row.h2}</td>
                  <td className="p-3 border-r font-semibold text-emerald-600">{row.h3}</td>
                  <td className="p-3 border-r text-slate-500">{row.h4}</td>
                  <td className="p-3 border-r bg-amber-50/50 dark:bg-amber-950/20 text-slate-400 font-mono text-[10px]">REST</td>
                  <td className="p-3 border-r font-semibold text-sky-600">{row.h5}</td>
                  <td className="p-3 font-semibold text-sky-600">{row.h6}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassTimetablePage;
