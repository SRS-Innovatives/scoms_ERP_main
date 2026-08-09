import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const SMSCenterPage = () => {
  const [showModal, setShowModal] = useState(false);

  const smsLogs = [
    { batchId: 'SMS-84920', template: 'Absentee Alert', recipients: '48 Parents', status: 'Delivered (DLT Verified)', time: '09-Aug-2026 10:15 AM' },
    { batchId: 'SMS-84918', template: 'Fee Due Reminder', recipients: '142 Students', status: 'Delivered (DLT Verified)', time: '05-Aug-2026 04:30 PM' }
  ];

  const columns = [
    { header: 'Batch ID', key: 'batchId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'DLT Template', key: 'template', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Recipient Count', key: 'recipients', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Gateway Status', key: 'status', render: (val) => <span className="flex items-center gap-1 font-semibold text-emerald-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{val}</span> },
    { header: 'Dispatch Time', key: 'time', render: (val) => <span className="font-mono">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">DLT Bulk SMS Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">TRAI DLT compliant bulk SMS broadcast center with recipient category filters</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Compose Bulk SMS</span>
        </button>
      </div>

      <DataTable columns={columns} data={smsLogs} />
      <SMSComposeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default SMSCenterPage;
