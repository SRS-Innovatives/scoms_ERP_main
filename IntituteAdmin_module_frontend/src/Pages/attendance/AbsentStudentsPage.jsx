import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { studentsList } from '../../data/mockData';
import { MessageSquare, PhoneCall, Filter } from 'lucide-react';

export const AbsentStudentsPage = () => {
  const [showSmsModal, setShowSmsModal] = useState(false);
  const absentees = studentsList.slice(1, 4); // sample absentees

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-rose-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course & Dept', key: 'course' },
    { header: 'Parent Name', key: 'fatherName' },
    { header: 'Parent Phone (SMS Target)', key: 'parentPhone', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Status', key: 'id', render: () => <StatusBadge status="Absent" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Absent Student List & Parent SMS Dispatch</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">List of unexcused absent students for today with automated parent SMS broadcast</p>
        </div>

        {/* Primary Action Button explicitly requested */}
        <button
          onClick={() => setShowSmsModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send SMS to Absent Students ({absentees.length})</span>
        </button>
      </div>

      <DataTable columns={columns} data={absentees} />

      <SMSComposeModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} defaultRecipientType="absentees" />
    </div>
  );
};

export default AbsentStudentsPage;
