import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockAuditLogs } from '../../data/mockAuditLogs';

export const AuditLogsPage = () => {
  const columns = [
    { header: 'ID', key: 'id', render: (v) => <span className="font-mono text-indigo-600 font-bold">{v}</span> },
    { header: 'Timestamp', key: 'timestamp' },
    { header: 'User', key: 'user', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Institution', key: 'institution' },
    { header: 'Action', key: 'action', render: (v) => <span className="font-bold">{v}</span> },
    { header: 'Module', key: 'module' },
    { header: 'Record', key: 'record' },
    { header: 'IP Address', key: 'ip', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Audit Trail Logs" subtitle="Immutable activity ledger tracking every Super Admin and Institution action across SCOMS." />
      <DataTable columns={columns} data={mockAuditLogs} />
    </div>
  );
};

export default AuditLogsPage;
