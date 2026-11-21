import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Clock, AlertTriangle, Calendar, CheckCircle, Loader2, MessageSquareWarning, X } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';

// Same window and choices as Student_Backend attendanceCorrectionController
const REQUEST_WINDOW_DAYS = 30;
const CHOICES = [
  { value: 'PRESENT', label: 'I was present' },
  { value: 'ON_DUTY', label: 'I was on official duty (sports, event, NCC...)' },
  { value: 'LATE', label: 'I came late, not absent' },
];
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const statusText = (s) => String(s || '').replace('_', ' ').toLowerCase();

/** "Request correction" dialog for one class session. */
const CorrectionDialog = ({ record, onClose, onSent }) => {
  const { success, error: showError } = useNotification();
  const choices = CHOICES.filter((c) => c.value !== record.status);
  const [newStatus, setNewStatus] = useState(choices[0]?.value || 'PRESENT');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await attendanceService.requestCorrection({ sessionId: record.sessionId, newStatus, reason: reason.trim() });
      success('Correction request sent — you will be notified of the decision');
      onSent();
    } catch (err) {
      showError(err.message || 'Could not send the request');
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={send} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md space-y-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Request attendance correction</h3>
            <p className="text-slate-500">{fmtDay(record.date)} · {record.subject}{record.periodNumber ? ` · Period ${record.periodNumber}` : ''} · marked <b>{statusText(record.status)}</b></p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-1.5">
          {choices.map((c) => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="newStatus" value={c.value} checked={newStatus === c.value} onChange={() => setNewStatus(c.value)} />
              <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
            </label>
          ))}
        </div>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} required placeholder="Explain what happened — e.g. I was in class, the wrong roll number was marked" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">Cancel</button>
          <button type="submit" disabled={sending || reason.trim().length < 5} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50">
            {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send request
          </button>
        </div>
      </form>
    </div>
  );
};

export const AttendanceDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [asking, setAsking] = useState(null);

  const loadCorrections = useCallback(() => {
    attendanceService.getMyCorrections().then((res) => setCorrections(res.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    attendanceService.getAttendance()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load attendance'))
      .finally(() => setLoading(false));
    loadCorrections();
  }, [loadCorrections]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="glass-card p-8 rounded-3xl border border-rose-200 dark:border-rose-900 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>;
  }

  const lowSubjects = (data.subjectBreakdown || []).filter((s) => s.percentage < 75);
  // classes in the last 30 days where I wasn't marked present — each can be questioned
  const since = Date.now() - REQUEST_WINDOW_DAYS * 86400000;
  const pendingFor = new Set(corrections.filter((c) => c.status === 'PENDING').map((c) => c.sessionId));
  const missed = (data.records || []).filter((r) => r.sessionId && r.status !== 'PRESENT' && new Date(r.date).getTime() >= since);

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance Dashboard" subtitle="Track subject-wise presence and low attendance warnings." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${data.percentage}%`}
          subtitle={data.percentage >= 75 ? 'Eligible for Exams (>75%)' : 'Below eligibility threshold'}
          icon={Clock}
          color={data.percentage >= 75 ? 'emerald' : 'rose'}
          badgeText={data.percentage >= 75 ? 'Pass Criteria Met' : 'At Risk'}
        />
        <StatCard title="Total Classes Conducted" value={`${data.totalClasses} Classes`} icon={Calendar} color="indigo" />
        <StatCard title="Classes Attended" value={`${data.presentCount} Classes`} icon={CheckCircle} color="emerald" />
        <StatCard title="Absences" value={`${data.absentCount} Classes`} icon={AlertTriangle} color="amber" />
      </div>

      {lowSubjects.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200">Attendance Alert Notice</h4>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Your attendance in <span className="font-bold">{lowSubjects.map((s) => `${s.subject} (${s.percentage}%)`).join(', ')}</span> is below the 75% eligibility threshold.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Subject-wise Attendance Breakdown</h3>
        {(data.subjectBreakdown || []).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No attendance recorded yet.</p>
        ) : (
          <div className="space-y-3 text-xs">
            {data.subjectBreakdown.map((sub) => (
              <div key={sub.subject} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{sub.subject}</h4>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className={`font-black text-sm ${sub.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{sub.percentage}%</p>
                    <p className="text-[10px] text-slate-400">{sub.present}/{sub.total} classes</p>
                  </div>
                  <StatusBadge status={sub.percentage < 75 ? 'Low' : 'Good'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><MessageSquareWarning className="w-4 h-4 text-indigo-500" /> Marked wrongly?</h3>
          <p className="text-[11px] text-slate-500">Classes in the last {REQUEST_WINDOW_DAYS} days where you were not marked present. If a mark is wrong, request a correction — your Principal / HOD decides it and you will be notified.</p>
        </div>
        {missed.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nothing to correct — no absences or late marks in the last {REQUEST_WINDOW_DAYS} days.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {missed.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDay(r.date)} · {r.subject}{r.periodNumber ? ` · P${r.periodNumber}` : ''}</p>
                  <p className="text-[11px] text-slate-500">Marked {statusText(r.status)}{r.remarks ? ` · ${r.remarks}` : ''}</p>
                </div>
                {pendingFor.has(r.sessionId) ? (
                  <span className="text-[11px] font-semibold text-amber-600 shrink-0">Request pending</span>
                ) : (
                  <button onClick={() => setAsking(r)} className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] hover:bg-indigo-100">Request correction</button>
                )}
              </li>
            ))}
          </ul>
        )}

        {corrections.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-2">My correction requests</h4>
            <ul className="space-y-2 text-xs">
              {corrections.map((c) => (
                <li key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{fmtDay(c.session?.date)} · {c.session?.subject?.name || 'General'} — {statusText(c.oldStatus) || 'not marked'} → {statusText(c.newStatus)}</p>
                    <p className="text-[11px] text-slate-500 truncate">"{c.reason}"</p>
                    {c.reviewRemarks && <p className="text-[11px] text-slate-600 dark:text-slate-400">Reply: {c.reviewRemarks}</p>}
                  </div>
                  <StatusBadge status={c.status === 'PENDING' ? 'Pending' : c.status === 'APPROVED' ? 'Approved' : 'Rejected'} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {asking && (
        <CorrectionDialog
          record={asking}
          onClose={() => setAsking(null)}
          onSent={() => { setAsking(null); loadCorrections(); }}
        />
      )}
    </div>
  );
};

export default AttendanceDashboardPage;
