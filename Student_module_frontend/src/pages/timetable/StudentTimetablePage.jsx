import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { mockTodaySchedule } from '../../data/mockStudentData';
import { Clock, Video, MapPin, User } from 'lucide-react';

export const StudentTimetablePage = () => {
  const [viewMode, setViewMode] = useState('Daily');

  const weeklySchedule = [
    { day: "Monday", slots: ["CS8401 (OS)", "CS8402 (DSA)", "CS8403 (DBMS)", "CS8405 (Web Lab)"] },
    { day: "Tuesday", slots: ["CS8404 (SE)", "CS8401 (OS)", "CS8402 (DSA)", "CS8403 (DBMS)"] },
    { day: "Wednesday", slots: ["CS8403 (DBMS)", "CS8405 (Web Lab)", "CS8401 (OS)", "CS8404 (SE)"] },
    { day: "Thursday", slots: ["CS8402 (DSA)", "CS8404 (SE)", "CS8401 (OS)", "CS8403 (DBMS)"] },
    { day: "Friday", slots: ["CS8405 (Web Lab)", "CS8402 (DSA)", "CS8404 (SE)", "CS8401 (OS)"] }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">My Class Timetable</h1>
          <p className="text-xs text-slate-500 mt-1">Semester 4 Class Schedule & Virtual Room Links</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setViewMode('Daily')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              viewMode === 'Daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Today Schedule
          </button>
          <button
            onClick={() => setViewMode('Weekly')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              viewMode === 'Weekly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Weekly Master Grid
          </button>
        </div>
      </div>

      {viewMode === 'Daily' ? (
        <div className="space-y-4">
          {mockTodaySchedule.map((cls) => {
            const isCurrent = cls.status === 'In Progress';
            return (
              <div
                key={cls.period}
                className={`glass-card p-5 rounded-3xl border transition-all ${
                  isCurrent
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className={`px-3.5 py-2 rounded-2xl font-black text-sm ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      P{cls.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cls.subject}</h3>
                        <span className="font-mono text-xs text-indigo-600 font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                          {cls.code}
                        </span>
                        {isCurrent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">LIVE NOW</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Teacher: <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.teacher}</span> • Room: {cls.room}</p>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {cls.startTime} - {cls.endTime}
                      </p>
                    </div>
                  </div>

                  {cls.onlineLink && (
                    <a
                      href={cls.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" /> Join Online Class
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Day</th>
                <th className="p-3">09:30 - 10:30</th>
                <th className="p-3">10:30 - 11:30</th>
                <th className="p-3">11:45 - 12:45</th>
                <th className="p-3">01:30 - 03:30</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {weeklySchedule.map((row) => (
                <tr key={row.day} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.day}</td>
                  {row.slots.map((s, idx) => (
                    <td key={idx} className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{s}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;
