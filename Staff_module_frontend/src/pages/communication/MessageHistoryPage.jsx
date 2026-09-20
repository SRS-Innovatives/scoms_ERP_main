import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import smsService from '../../services/smsService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const STATUS_STYLE = {
  SENT: 'text-emerald-600 dark:text-emerald-400',
  SIMULATED: 'text-sky-600 dark:text-sky-400',
  FAILED: 'text-rose-600 dark:text-rose-400',
};

const PURPOSE_LABEL = {
  STAFF_BROADCAST: 'Bulk SMS Broadcast',
  ATTENDANCE_ALERT: 'Absence Alert (Auto)',
};

export const MessageHistoryPage = () => {
  const { error: showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    smsService.getMyHistory()
      .then((res) => setLogs(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load message history', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-sky-500" /> Sent Broadcast & Notification History
      </h3>

      {logs.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">You haven't sent any SMS broadcasts or triggered any absence alerts yet.</p>
      ) : (
        <div className="space-y-2 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-start gap-3">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {PURPOSE_LABEL[log.purpose] || log.purpose || 'SMS'} — To: {log.recipientPhone}
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.message}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`font-bold ${STATUS_STYLE[log.status] || 'text-slate-400'}`}>{log.status}</span>
                <p className="text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageHistoryPage;
