import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import FormModal from '../../components/common/FormModal';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Lock, ClipboardCheck, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import settingsService from '../../services/settingsService';

const btn = 'px-3 py-2 text-xs font-bold rounded-xl disabled:opacity-50';

export const AttendanceCorrectionsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [lockDays, setLockDays] = useState('');
  const [savingLock, setSavingLock] = useState(false);
  const [status, setStatus] = useState('PENDING');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    settingsService.getSettings()
      .then((res) => setLockDays(res.data?.attendanceLockDays ?? ''))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await attendanceService.getCorrections(status);
      setRequests(res.data || []);
    } catch (err) {
      notifyError(`Failed to load correction requests: ${err.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [status, notifyError]);

  useEffect(() => { load(); }, [load]);

  const saveLock = async () => {
    setSavingLock(true);
    try {
      await settingsService.updateSettings({ attendanceLockDays: lockDays === '' ? null : Number(lockDays) });
      notifySuccess(lockDays === '' ? 'Attendance lock disabled — staff can edit any session.' : `Sessions older than ${lockDays} day(s) are now locked.`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSavingLock(false);
    }
  };

  const review = async (id, decision, reviewRemarks) => {
    setBusyId(id);
    try {
      await attendanceService.reviewCorrection(id, decision, reviewRemarks);
      notifySuccess(decision === 'APPROVE' ? 'Correction applied to the register' : 'Correction rejected');
      setRejectId(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Lock & Corrections</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Lock old attendance and approve staff correction requests</p>
      </div>

      <FormSection title="Attendance Lock" icon={Lock}>
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex-1 min-w-[220px]">
            <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lock sessions older than (days)</span>
            <input type="number" min="0" max="365" value={lockDays} onChange={(e) => setLockDays(e.target.value)} placeholder="Empty = never lock" className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </label>
          <button onClick={saveLock} disabled={savingLock} className={`${btn} px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white`}>{savingLock ? 'Saving...' : 'Save'}</button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Once locked, staff can't edit or back-fill those sessions; they raise correction requests that appear below.</p>
      </FormSection>

      <FormSection title="Correction Requests" icon={ClipboardCheck}>
        <div className="flex gap-2 mb-3">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`${btn} ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{s}</button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : requests.length === 0 ? (
          <p className="text-xs text-slate-500">No {status.toLowerCase()} requests.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {c.student?.firstName} {c.student?.lastName} ({c.student?.rollNumber || '-'}) · {c.session?.section?.name}
                    {c.session?.subject?.name ? ` / ${c.session.subject.name}` : ''}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {new Date(c.session?.date).toLocaleDateString('en-IN')} · Period {c.session?.periodNumber} · {c.oldStatus || '—'} → <b>{c.newStatus}</b> · {c.reason}
                  </p>
                  {c.reviewRemarks && <p className="text-slate-500">Remarks: {c.reviewRemarks}</p>}
                </div>
                {c.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button disabled={busyId === c.id} onClick={() => review(c.id, 'APPROVE')} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Approve</button>
                    <button disabled={busyId === c.id} onClick={() => { setRemarks(''); setRejectId(c.id); }} className={`${btn} bg-rose-600 hover:bg-rose-700 text-white`}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormModal
        isOpen={Boolean(rejectId)}
        title="Reject Correction Request"
        fields={[{ name: 'remarks', label: 'Remarks', type: 'textarea', required: true }]}
        values={{ remarks }}
        onChange={(_, v) => setRemarks(v)}
        onSubmit={(e) => { e?.preventDefault?.(); if (!remarks.trim()) { notifyError('Remarks are required'); return; } review(rejectId, 'REJECT', remarks); }}
        onClose={() => setRejectId(null)}
        submitLabel="Reject"
        isSubmitting={Boolean(busyId)}
      />
    </div>
  );
};

export default AttendanceCorrectionsPage;
