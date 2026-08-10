import React from 'react';
import { mockStudentsList } from '../../data/mockStaffData';
import { Send, PhoneCall } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AbsentStudentsPage = () => {
  const { success } = useNotification();
  const absentees = mockStudentsList.filter(s => s.status === 'Absent');

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Today's Absent Students List</h3>
          <p className="text-xs text-slate-500">Class 12-A • Date: 11-Aug-2026</p>
        </div>
        <button
          onClick={() => success(`SMS dispatched to ${absentees.length} parents.`, 'SMS Dispatched')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
        >
          <Send className="w-4 h-4" /> Broadcast SMS to All Absentees
        </button>
      </div>

      <div className="space-y-3">
        {absentees.map((s) => (
          <div key={s.id} className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name} (Roll #{s.rollNo})</h4>
              <p className="text-xs text-slate-500">Attendance: {s.attendancePercent}% • Parent Contact: {s.parentContact}</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <PhoneCall className="w-3.5 h-3.5" /> Call Parent
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbsentStudentsPage;
