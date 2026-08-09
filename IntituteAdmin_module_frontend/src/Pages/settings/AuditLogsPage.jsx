import React from 'react';
import DataTable from '../../components/common/DataTable';
import { ShieldCheck, User } from 'lucide-react';

export const AuditLogsPage = () => {
  const logs = [
    { logId: 'LOG-98401', user: 'Dr. S. K. Rajan (Principal)', action: 'Fee Receipt REC/2025/04921 Printed', ip: '192.168.1.104', timestamp: '09-Aug-2026 06:15 PM' },
    { logId: 'LOG-98400', user: 'G. Murugesan (Accountant)', action: 'Collected ₹46,000 via UPI (Kavitha R.)', ip: '192.168.1.112', timestamp: '09-Aug-2026 05:42 PM' },
    { logId: 'LOG-98399', user: 'Prof. S. Malathi (Faculty)', action: 'Locked CAT-1 Marks for CS8601', ip: '192.168.2.45', timestamp: '09-Aug-2026 04:30 PM' }
  ];

  const columns = [
    { header: 'Log ID', key: 'logId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'User Account', key: 'user', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Performed Action', key: 'action', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'IP Address', key: 'ip', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Timestamp', key: 'timestamp', render: (val) => <span className="font-mono">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Audit Trail & Security Logs</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Immutable security logs tracking user logins, mark edits, fee collections & document generation</p>
      </div>

      <DataTable columns={columns} data={logs} />
    </div>
  );
};

export default AuditLogsPage;
