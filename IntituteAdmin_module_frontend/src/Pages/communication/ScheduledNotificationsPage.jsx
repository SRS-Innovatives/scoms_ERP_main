import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import ScheduleNotificationModal from '../../components/modals/ScheduleNotificationModal';
import { useNotification } from '../../context/NotificationContext';
import { Clock, Send, Loader2, XCircle } from 'lucide-react';
import notificationSchedulerService from '../../services/notificationSchedulerService';

export const ScheduledNotificationsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    notificationSchedulerService.getScheduled()
      .then((res) => setScheduled(res.data || []))
      .catch((err) => { notifyError(`Failed to load scheduled notifications: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async (id) => {
    try {
      await notificationSchedulerService.cancelScheduled(id);
      notifySuccess('Scheduled notification cancelled');
      fetchAll();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const columns = [
    { header: 'Channel', key: 'channel', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Recipients', key: 'recipientGroup' },
    { header: 'Message', key: 'message', render: (val) => <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs block">{val}</span> },
    { header: 'Scheduled For', key: 'scheduledFor', render: (val) => <span className="font-mono">{new Date(val).toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Result', key: 'resultSummary', sortable: false,
      render: (val) => val ? <span className="text-xs">{val.sent} sent / {val.skipped} skipped</span> : '—',
    },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => row.status === 'PENDING'
        ? <button onClick={() => handleCancel(id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600" title="Cancel"><XCircle className="w-3.5 h-3.5" /></button>
        : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Scheduled Notifications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Queue an SMS, Email or WhatsApp broadcast for a future date and time</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          <Send className="w-4 h-4" />
          <span>Schedule Notification</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchAll} />
      ) : scheduled.length === 0 ? (
        <EmptyState title="Nothing Scheduled" description="Queue your first future broadcast." icon={Clock} />
      ) : (
        <DataTable columns={columns} data={scheduled} />
      )}

      <ScheduleNotificationModal isOpen={showModal} onClose={() => { setShowModal(false); fetchAll(); }} />
    </div>
  );
};

export default ScheduledNotificationsPage;
