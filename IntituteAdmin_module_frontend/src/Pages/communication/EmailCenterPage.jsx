import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import EmailComposeModal from '../../components/modals/EmailComposeModal';
import { useNotification } from '../../context/NotificationContext';
import { Mail, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import broadcastService from '../../services/broadcastService';

export const EmailCenterPage = () => {
  const { notifyError } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    broadcastService.getEmailLogs()
      .then((res) => setLogs(res.data || []))
      .catch((err) => notifyError(`Failed to load email logs: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { header: 'Recipient', key: 'recipientEmail', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600 shrink-0" />{val}</span> },
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email Broadcast Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast email to absentees, fee defaulters, a course, all students, or staff</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <Send className="w-4 h-4" />
          <span>Compose Email</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No Emails Sent Yet" description="Compose an email broadcast to get started." icon={Mail} />
      ) : (
        <DataTable columns={columns} data={logs} />
      )}

      <EmailComposeModal isOpen={showModal} onClose={() => { setShowModal(false); fetchLogs(); }} />
    </div>
  );
};

export default EmailCenterPage;
