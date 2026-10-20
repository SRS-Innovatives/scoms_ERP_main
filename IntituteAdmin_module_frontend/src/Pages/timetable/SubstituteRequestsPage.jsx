import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import FormModal from '../../components/common/FormModal';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { UserCheck, Loader2, X } from 'lucide-react';
import timetableService from '../../services/timetableService';

const btn = 'px-3 py-2 text-xs font-bold rounded-xl disabled:opacity-50';
const personName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.employeeCode || '—';
const sectionName = (e) => [e?.timetable?.section?.semester?.course?.name, e?.timetable?.section?.name].filter(Boolean).join(' - ');

export const SubstituteRequestsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [status, setStatus] = useState('PENDING');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [available, setAvailable] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [substituteStaffId, setSubstituteStaffId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await timetableService.getSubstituteRequests(status);
      setRequests(res.data || []);
    } catch (err) {
      notifyError(`Failed to load substitute requests: ${err.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [status, notifyError]);

  useEffect(() => { load(); }, [load]);

  const openAssign = async (request) => {
    setAssigning(request);
    setSubstituteStaffId('');
    setLoadingAvailable(true);
    try {
      const res = await timetableService.getAvailableSubstitutes(request.id);
      setAvailable(res.data || []);
    } catch (err) {
      notifyError(err.message);
      setAvailable([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const review = async (id, body) => {
    setBusyId(id);
    try {
      await timetableService.reviewSubstituteRequest(id, body);
      notifySuccess(body.decision === 'APPROVE' ? 'Substitute assigned' : 'Request rejected');
      setRejectId(null);
      setAssigning(null);
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Substitute Requests</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Approve cover requests from staff and assign a free teacher for that date</p>
      </div>

      <FormSection title="Requests" icon={UserCheck}>
        <div className="flex gap-2 mb-3">
          {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
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
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} · Period {r.entry?.period} ({r.entry?.startTime}-{r.entry?.endTime})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {r.entry?.subject?.name || '—'} · {sectionName(r.entry)} · Teacher: {personName(r.originalStaff)} · {r.reason}
                  </p>
                  {r.substituteStaff && <p className="text-emerald-600">Covered by {personName(r.substituteStaff)}</p>}
                  {r.reviewRemarks && <p className="text-slate-500">Remarks: {r.reviewRemarks}</p>}
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button disabled={busyId === r.id} onClick={() => openAssign(r)} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Assign & Approve</button>
                    <button disabled={busyId === r.id} onClick={() => { setRemarks(''); setRejectId(r.id); }} className={`${btn} bg-rose-600 hover:bg-rose-700 text-white`}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Choose a substitute</h3>
              <button onClick={() => setAssigning(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Teachers with no class, cover or approved leave in this period on that date.</p>
            {loadingAvailable ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
            ) : available.length === 0 ? (
              <p className="text-xs text-rose-600">No teacher is free for this period.</p>
            ) : (
              <select value={substituteStaffId} onChange={(e) => setSubstituteStaffId(e.target.value)} className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <option value="">Select teacher</option>
                {available.map((s) => <option key={s.id} value={s.id}>{personName(s)} ({s.employeeCode})</option>)}
              </select>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setAssigning(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg">Cancel</button>
              <button
                disabled={!substituteStaffId || busyId === assigning.id}
                onClick={() => review(assigning.id, { decision: 'APPROVE', substituteStaffId })}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <FormModal
        isOpen={Boolean(rejectId)}
        title="Reject Substitute Request"
        fields={[{ name: 'remarks', label: 'Remarks', type: 'textarea', required: true }]}
        values={{ remarks }}
        onChange={(_, v) => setRemarks(v)}
        onSubmit={(e) => { e?.preventDefault?.(); if (!remarks.trim()) { notifyError('Remarks are required'); return; } review(rejectId, { decision: 'REJECT', remarks }); }}
        onClose={() => setRejectId(null)}
        submitLabel="Reject"
        isSubmitting={Boolean(busyId)}
      />
    </div>
  );
};

export default SubstituteRequestsPage;
