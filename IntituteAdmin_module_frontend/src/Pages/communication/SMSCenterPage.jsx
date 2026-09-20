import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import broadcastService from '../../services/broadcastService';

export const SMSCenterPage = () => {
  const { notifyError } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(false);
    broadcastService.getSmsLogs()
      .then((res) => setLogs(res.data || []))
      .catch((err) => { notifyError(`Failed to load SMS logs: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { header: 'Recipient', key: 'recipientPhone', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Message', key: 'message', render: (val) => <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs block">{val}</span> },
    { header: 'Purpose', key: 'purpose', render: (val) => val || '—' },
    { header: 'Provider', key: 'provider' },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val) => (
        <span className={`flex items-center gap-1 font-semibold text-xs ${val === 'SENT' ? 'text-emerald-600' : val === 'FAILED' ? 'text-rose-600' : 'text-amber-600'}`}>
          {val === 'SENT' ? <CheckCircle2 className="w-3.5 h-3.5" /> : val === 'FAILED' ? <XCircle className="w-3.5 h-3.5" /> : null}
          {val}
        </span>
      ),
    },
    { header: 'Dispatch Time', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk SMS Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast SMS to absentees, fee defaulters, a course, all students, or staff</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          <Send className="w-4 h-4" />
          <span>Compose Bulk SMS</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState title="No SMS Sent Yet" description="Compose a bulk SMS to get started." icon={MessageSquare} />
      ) : (
        <DataTable columns={columns} data={logs} />
      )}

      <SMSComposeModal isOpen={showModal} onClose={() => { setShowModal(false); fetchLogs(); }} />
    </div>
  );
};

export default SMSCenterPage;
