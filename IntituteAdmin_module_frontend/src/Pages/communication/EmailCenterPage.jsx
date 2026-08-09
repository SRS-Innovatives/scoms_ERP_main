import React from 'react';
import DataTable from '../../components/common/DataTable';
import { Mail, Send } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const EmailCenterPage = () => {
  const { notifySuccess } = useNotification();
  const emailLogs = [
    { subject: 'End Semester Exam Timetable Published', recipients: '3,450 Students', sentTime: '08-Aug-2026 11:00 AM', status: 'Sent via SMTP' }
  ];

  const columns = [
    { header: 'Email Subject', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Target Recipients', key: 'recipients' },
    { header: 'Dispatch Timestamp', key: 'sentTime', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'SMTP Status', key: 'status', render: (val) => <span className="font-semibold text-emerald-600">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email Newsletter & Broadcast Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">SMTP HTML email broadcast module for academic notices & fee receipts</p>
        </div>
        <button onClick={() => notifySuccess('Compose Email Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          <Send className="w-4 h-4" />
          <span>Compose Email</span>
        </button>
      </div>

      <DataTable columns={columns} data={emailLogs} />
    </div>
  );
};

export default EmailCenterPage;
