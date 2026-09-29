import React, { useState, useEffect, useCallback } from 'react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, Users } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const AbsentStudentsPage = () => {
  const { error: showError } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getHistory()
      .then((res) => setSessions((res.data || []).filter((s) => s.absentCount > 0)))
      .catch((err) => { showError(err.message || 'Failed to load attendance history', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-rose-500" /> Sessions With Absences
        </h3>
        <p className="text-xs text-slate-500">Your last 30 attendance sessions that had at least one absent student. Parents were notified automatically by SMS at save time.</p>
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-10">No absences recorded across your recent sessions.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.section} — {s.subject}</h4>
                <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString('en-IN')} • Period {s.periodNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-600">{s.absentCount} Absent</p>
                <p className="text-[11px] text-slate-400">{s.presentCount} / {s.totalStudents} Present</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AbsentStudentsPage;
