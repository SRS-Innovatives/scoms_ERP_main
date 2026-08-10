import React from 'react';
import StatusBadge from './StatusBadge';
import { Eye, Edit, MessageSquare, PhoneCall } from 'lucide-react';

export const StudentTable = ({ students = [], onViewProfile, onContactParent }) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Attendance %</th>
              <th className="px-4 py-3">Last Marks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  {student.rollNo}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {student.name}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {student.gender}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {student.class}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          student.attendancePercent < 75
                            ? 'bg-rose-500'
                            : student.attendancePercent < 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${student.attendancePercent}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-xs">{student.attendancePercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {student.lastMarks} / 100
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={student.status} size="sm" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewProfile && onViewProfile(student)}
                      title="View Student"
                      className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onContactParent && onContactParent(student)}
                      title="Contact Parent"
                      className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
