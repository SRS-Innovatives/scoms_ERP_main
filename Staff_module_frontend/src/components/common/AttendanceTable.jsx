import React, { useState } from 'react';
import { Check, X, Clock, ShieldAlert, Send } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const AttendanceTable = ({
  students = [],
  onStatusChange,
  onMarkAllPresent,
  onSendSms
}) => {
  const [attendanceMap, setAttendanceMap] = useState(() => {
    const initial = {};
    students.forEach(s => {
      initial[s.id] = s.status || 'Present';
    });
    return initial;
  });

  const handleToggle = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    if (onStatusChange) onStatusChange(studentId, status);
  };

  const handleMarkAll = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = 'Present';
    });
    setAttendanceMap(updated);
    if (onMarkAllPresent) onMarkAllPresent();
  };

  const absenteesCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Attendance List</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Students: <span className="font-semibold text-slate-700 dark:text-slate-300">{students.length}</span> |
            Absentees: <span className="font-semibold text-rose-600 dark:text-rose-400">{absenteesCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={() => onSendSms && onSendSms(absenteesCount)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send SMS to Absentees ({absenteesCount})</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Class & Sec</th>
              <th className="px-4 py-3">Attendance %</th>
              <th className="px-4 py-3">Parent Contact</th>
              <th className="px-4 py-3 text-center">Status Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((student) => {
              const currentStatus = attendanceMap[student.id] || student.status || 'Present';
              return (
                <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {student.rollNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {student.class}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${student.attendancePercent < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {student.attendancePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {student.parentContact}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggle(student.id, 'Present')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <Check className="w-3 h-3" /> P
                      </button>

                      <button
                        onClick={() => handleToggle(student.id, 'Absent')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                      >
                        <X className="w-3 h-3" /> A
                      </button>

                      <button
                        onClick={() => handleToggle(student.id, 'Late')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                          currentStatus === 'Late'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        <Clock className="w-3 h-3" /> L
                      </button>

                      <button
                        onClick={() => handleToggle(student.id, 'On Duty')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                          currentStatus === 'On Duty'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" /> OD
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
