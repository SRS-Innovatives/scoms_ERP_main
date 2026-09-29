import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

export const LateEntryPage = () => {
  const { error: showError } = useNotification();
  const now = new Date();
  const [lateRecords, setLateRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    profileService.getMyAttendance(now.getMonth(), now.getFullYear())
      .then((res) => setLateRecords((res.data.records || []).filter((r) => r.status === 'LATE')))
      .catch((err) => { showError(err.message || 'Failed to load late entries', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" /> Late Entry Punch Log
      </h3>
      <p className="text-xs text-slate-500 -mt-2">Days this month marked LATE by your Institute Admin</p>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : lateRecords.length === 0 ? (
        <p className="text-xs text-slate-400">No late entries recorded this month.</p>
      ) : (
        <div className="space-y-2">
          {lateRecords.map((r) => (
            <div key={r.id} className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs flex justify-between font-semibold">
              <span>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {r.checkInTime ? `• Punch In: ${r.checkInTime}` : ''}</span>
              <span className="text-amber-700">LATE</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LateEntryPage;
