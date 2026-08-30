import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck, User, Loader2 } from 'lucide-react';
import settingsService from '../../services/settingsService';

export const AuditLogsPage = () => {
  const { notifyError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getAuditLogs()
      .then((res) => setLogs(res.data || []))
      .catch((err) => notifyError(`Failed to load audit logs: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const columns = [
    { header: 'User Account', key: 'user', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" />{val?.email || 'System'}</span> },
    { header: 'Role', key: 'user2', sortable: false, render: (_, row) => row.user?.role || '—' },
    { header: 'Module', key: 'module', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{val}</span> },
    { header: 'Action', key: 'action', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val.replace(/_/g, ' ')}</span> },
    { header: 'Entity', key: 'entity', render: (val) => val || '—' },
    { header: 'Timestamp', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Audit Trail & Security Logs</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Immutable log of actions across every module — marks entry, fee collection, module toggles, document generation</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No Audit Events Yet" description="Actions across the system will appear here as they happen." icon={ShieldCheck} />
      ) : (
        <DataTable columns={columns} data={logs} />
      )}
    </div>
  );
};

export default AuditLogsPage;
