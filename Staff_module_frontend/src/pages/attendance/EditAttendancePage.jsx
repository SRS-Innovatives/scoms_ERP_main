import React from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import { mockStudentsList } from '../../data/mockStaffData';
import { useNotification } from '../../context/NotificationContext';
import { Edit3, Save } from 'lucide-react';

export const EditAttendancePage = () => {
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-amber-500" /> Edit Past Attendance Record
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select class and date to modify attendance logs with approval audit trail.</p>
      </div>

      <AttendanceTable students={mockStudentsList} />

      <div className="flex justify-end">
        <button
          onClick={() => success('Updated attendance register saved!', 'Attendance Modified')}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md"
        >
          <Save className="w-4 h-4" /> Save Modifications
        </button>
      </div>
    </div>
  );
};

export default EditAttendancePage;
