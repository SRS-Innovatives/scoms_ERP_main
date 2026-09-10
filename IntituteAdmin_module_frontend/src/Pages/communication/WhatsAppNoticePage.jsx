import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import WhatsAppComposeModal from '../../components/modals/WhatsAppComposeModal';
import { useNotification } from '../../context/NotificationContext';
import { MessageCircle, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import broadcastService from '../../services/broadcastService';

export const WhatsAppNoticePage = () => {
  const { notifyError } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    broadcastService.getWhatsappLogs()
      .then((res) => setLogs(res.data || []))
      .catch((err) => notifyError(`Failed to load WhatsApp logs: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { header: 'Recipient', key: 'recipientPhone', render: (val) => <span className="font-mono font-bold text-emerald-600">{val}</span> },
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Broadcast Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast WhatsApp messages to absentees, fee defaulters, a course, all students, or staff</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          <Send className="w-4 h-4" />
          <span>Compose WhatsApp Broadcast</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No WhatsApp Messages Sent Yet" description="Compose a WhatsApp broadcast to get started." icon={MessageCircle} />
      ) : (
        <DataTable columns={columns} data={logs} />
      )}

      <WhatsAppComposeModal isOpen={showModal} onClose={() => { setShowModal(false); fetchLogs(); }} />
    </div>
  );
};

export default WhatsAppNoticePage;
