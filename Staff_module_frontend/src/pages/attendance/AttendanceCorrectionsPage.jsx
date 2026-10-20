import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ClipboardCheck } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';

export const AttendanceCorrectionsPage = () => {
  const { success, error: showError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [remarks, setRemarks] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    attendanceService.getPendingCorrections()
      .then((res) => { setRequests(res.data || []); setForbidden(false); })
      .catch((err) => {
        if (err.status === 403 || /permission|forbidden|not allowed/i.test(err.message || '')) setForbidden(true);
        else showError(err.message || 'Failed to load correction requests', 'Load Failed');
      })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, decision, reviewRemarks) => {
    setBusyId(id);
    try {
      await attendanceService.reviewCorrection(id, decision, reviewRemarks);
      success(decision === 'APPROVE' ? 'Correction applied to the register' : 'Correction rejected', 'Done');
      setRejecting(null);
      setRemarks('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to review request', 'Review Failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  if (forbidden) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        Only HODs, Principals and admins can review attendance corrections.
      </div>
    );
  }

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-sky-600" /> Attendance Correction Requests ({requests.length})
      </h3>
      {requests.length === 0 ? (
        <p className="text-xs text-slate-500">No pending correction requests.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((c) => (
            <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {c.student?.firstName} {c.student?.lastName} ({c.student?.rollNumber || '-'}) · {c.session?.section?.name}
                    {c.session?.subject?.name ? ` / ${c.session.subject.name}` : ''}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {new Date(c.session?.date).toLocaleDateString()} · Period {c.session?.periodNumber} · {c.oldStatus || '—'} → <b>{c.newStatus}</b> · {c.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId === c.id} onClick={() => review(c.id, 'APPROVE')} className="px-3 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">Approve</button>
                  <button disabled={busyId === c.id} onClick={() => { setRejecting(c.id); setRemarks(''); }} className="px-3 py-2 font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50">Reject</button>
                </div>
              </div>
              {rejecting === c.id && (
                <div className="flex gap-2">
                  <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason for rejection" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                  <button disabled={!remarks.trim() || busyId === c.id} onClick={() => review(c.id, 'REJECT', remarks)} className="px-3 py-2 font-bold rounded-xl bg-slate-700 text-white disabled:opacity-50">Confirm</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceCorrectionsPage;
