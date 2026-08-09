import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { studentsList } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Check, X, MessageSquare, Save } from 'lucide-react';

export const DailyAttendancePage = () => {
  const { notifySuccess } = useNotification();
  const [attendance, setAttendance] = useState(
    studentsList.map((s) => ({ ...s, isPresent: true }))
  );
  const [showSmsModal, setShowSmsModal] = useState(false);

  const toggleAttendance = (id) => {
    setAttendance((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPresent: !s.isPresent } : s))
    );
  };

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course & Section', key: 'course' },
    {
      header: 'Today Attendance Status',
      key: 'isPresent',
      render: (isPresent, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAttendance(row.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isPresent
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-rose-600 text-white shadow-xs'
            }`}
          >
            {isPresent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            <span>{isPresent ? 'PRESENT' : 'ABSENT'}</span>
          </button>
        </div>
      )
    },
    { header: 'Parent Contact (SMS)', key: 'parentPhone', render: (val) => <span className="font-mono text-xs">{val}</span> }
  ];

  const absentCount = attendance.filter((s) => !s.isPresent).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Student Attendance Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Class advisor daily roll call marking & instant absentee alert system</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSmsModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send SMS ({absentCount} Absentees)</span>
          </button>
          <button
            onClick={() => notifySuccess('Daily Attendance Submitted & Locked!')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Submit Attendance</span>
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={attendance} />
      <SMSComposeModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} defaultRecipientType="absentees" />
    </div>
  );
};

export default DailyAttendancePage;
