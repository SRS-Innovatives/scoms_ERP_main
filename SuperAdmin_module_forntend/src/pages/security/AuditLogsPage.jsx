import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import { Loader2 } from 'lucide-react';
import auditLogService from '../../services/auditLogService';
import { useNotification } from '../../context/NotificationContext';

export const AuditLogsPage = () => {
  const { error: showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback((query = '') => {
    setLoading(true);
    auditLogService.getAuditLogs({ limit: 100, ...(query && { search: query }) })
      .then((res) => setLogs(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load audit logs', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(search), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = [
    { header: 'Timestamp', key: 'createdAt', render: (v) => <span className="font-mono text-xs">{new Date(v).toLocaleString()}</span> },
    { header: 'User', key: 'user', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v?.email || 'System'}</span> },
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => v?.name || '—' },
    { header: 'Action', key: 'action', render: (v) => <span className="font-bold">{v}</span> },
    { header: 'Module', key: 'module' },
    { header: 'Record', key: 'entity', render: (v, row) => v ? `${v}${row.entityId ? ` (${row.entityId.slice(0, 8)}...)` : ''}` : '—' },
    { header: 'IP Address', key: 'ipAddress', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Audit Trail Logs" subtitle="Real activity ledger — every logged Super Admin and Institution action across SCOMS." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by action, module, entity, IP, or user email..." />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <DataTable columns={columns} data={logs} />
      )}
    </div>
  );
};

export default AuditLogsPage;
