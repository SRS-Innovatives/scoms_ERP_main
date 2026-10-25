import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import FormModal from '../../components/common/FormModal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Globe, Loader2, ShieldCheck, FileEdit } from 'lucide-react';
import examService from '../../services/examService';
import settingsService from '../../services/settingsService';

const STATUS_STYLES = {
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  SUBMITTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  VERIFIED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
};

const btn = 'px-3 py-2 text-xs font-bold rounded-xl disabled:opacity-50';

export const ResultPublishPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [modal, setModal] = useState(null); // { kind: 'return' | 'reject', id }
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    setError(false);
    examService.getExams()
      .then((res) => {
        setExams(res.data || []);
        if ((res.data || []).length > 0) setExamId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load exams: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
    settingsService.getSettings()
      .then((res) => setApprovalRequired(Boolean(res.data?.examApprovalRequired)))
      .catch(() => {});
  }, [notifyError]);

  const fetchCorrections = useCallback(() => {
    examService.getCorrectionRequests('PENDING')
      .then((res) => setCorrections(res.data || []))
      .catch(() => setCorrections([]));
  }, []);

  const fetchSchedules = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await examService.getSchedules(examId);
      setSchedules(res.data || []);
    } catch (error) {
      notifyError(`Failed to load schedules: ${error.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [examId, notifyError]);

  useEffect(() => {
    fetchSchedules();
    fetchCorrections();
  }, [fetchSchedules, fetchCorrections]);

  const run = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      const res = await fn();
      notifySuccess(typeof successMsg === 'function' ? successMsg(res) : successMsg);
      fetchSchedules();
      fetchCorrections();
      return true;
    } catch (error) {
      notifyError(error.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleApproval = async () => {
    const next = !approvalRequired;
    try {
      await settingsService.updateSettings({ examApprovalRequired: next });
      setApprovalRequired(next);
      notifySuccess(next ? 'Approval workflow enabled — marks need verify + approve before publishing.' : 'Approval workflow disabled.');
    } catch (error) {
      notifyError(`Failed to update setting: ${error.message}`);
    }
  };

  const handleTogglePublish = (scheduleId) =>
    run(scheduleId, () => examService.publishResults(scheduleId), (res) =>
      res.data.isPublished ? 'Results published — visible to students now!' : 'Results unpublished.');

  const handleModalSubmit = async (e) => {
    e?.preventDefault?.();
    if (!remarks.trim()) { notifyError('Remarks are required'); return; }
    const ok = modal.kind === 'return'
      ? await run(modal.id, () => examService.returnMarks(modal.id, remarks), 'Marks returned to the teacher for rework')
      : await run(modal.id, () => examService.reviewCorrectionRequest(modal.id, 'REJECT', remarks), 'Correction request rejected');
    if (ok) { setModal(null); setRemarks(''); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Exam Result Publication Console</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review, approve and publish per-subject results — students only see marks after publishing</p>
      </div>

      <FormSection title="Approval Workflow" icon={ShieldCheck}>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-xs text-slate-600 dark:text-slate-300">
            Require marks to be <b>submitted → verified → approved</b> before publishing. Submitted marks are locked; changes go through correction requests.
          </span>
          <input type="checkbox" checked={approvalRequired} onChange={handleToggleApproval} className="w-5 h-5 accent-indigo-600" />
        </label>
      </FormSection>

      <FormSection title="Select Exam" icon={Globe}>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </FormSection>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchSchedules} />
      ) : schedules.length === 0 ? (
        <EmptyState title="No Subject Schedules" message="Add subject schedules under Exam Schedule first." />
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const status = s.markStatus || 'DRAFT';
            const busy = busyId === s.id;
            const canPublish = s.isPublished || !approvalRequired || status === 'APPROVED';
            return (
              <div
                key={s.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border ${s.isPublished ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}
              >
                <div>
                  <p className={`font-bold ${s.isPublished ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                    {s.subject?.name} — {s._count?.studentMarks ?? 0} marks entered
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[status]}`}>{status}</span>
                  </p>
                  <p className={`text-xs mt-0.5 ${s.isPublished ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {s.isPublished ? `Published on ${new Date(s.publishedAt).toLocaleString('en-IN')}. Visible on Student Portal.` : 'Not published — hidden from students.'}
                  </p>
                  {s.reviewRemarks && status === 'DRAFT' && (
                    <p className="text-xs mt-0.5 text-rose-600">Returned: {s.reviewRemarks}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!s.isPublished && status === 'DRAFT' && (
                    <button disabled={busy} onClick={() => run(s.id, () => examService.submitMarks(s.id), 'Marks submitted for verification')} className={`${btn} bg-amber-500 hover:bg-amber-600 text-white`}>Submit</button>
                  )}
                  {!s.isPublished && status === 'SUBMITTED' && (
                    <button disabled={busy} onClick={() => run(s.id, () => examService.verifyMarks(s.id), 'Marks verified')} className={`${btn} bg-sky-600 hover:bg-sky-700 text-white`}>Verify</button>
                  )}
                  {!s.isPublished && status === 'VERIFIED' && (
                    <button disabled={busy} onClick={() => run(s.id, () => examService.approveMarks(s.id), 'Marks approved — ready to publish')} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Approve</button>
                  )}
                  {!s.isPublished && status !== 'DRAFT' && (
                    <button disabled={busy} onClick={() => { setRemarks(''); setModal({ kind: 'return', id: s.id }); }} className={`${btn} bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200`}>Return</button>
                  )}
                  <button
                    onClick={() => handleTogglePublish(s.id)}
                    disabled={busy || !canPublish}
                    title={canPublish ? '' : 'Marks must be approved before publishing'}
                    className={`${btn} px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md`}
                  >
                    {busy ? 'Working...' : s.isPublished ? 'Unpublish' : 'Publish Live'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormSection title={`Pending Mark Corrections (${corrections.length})`} icon={FileEdit}>
        {corrections.length === 0 ? (
          <p className="text-xs text-slate-500">No pending correction requests.</p>
        ) : (
          <div className="space-y-2">
            {corrections.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {c.student?.firstName} {c.student?.lastName} ({c.student?.rollNumber || '-'}) · {c.examSchedule?.exam?.name} / {c.examSchedule?.subject?.name}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {c.oldIsAbsent ? 'Absent' : c.oldMarks ?? '—'} → <b>{c.newIsAbsent ? 'Absent' : c.newMarks}</b> / {c.examSchedule?.maxMarks} · {c.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId === c.id} onClick={() => run(c.id, () => examService.reviewCorrectionRequest(c.id, 'APPROVE'), 'Correction applied')} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Approve</button>
                  <button disabled={busyId === c.id} onClick={() => { setRemarks(''); setModal({ kind: 'reject', id: c.id }); }} className={`${btn} bg-rose-600 hover:bg-rose-700 text-white`}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormModal
        isOpen={Boolean(modal)}
        title={modal?.kind === 'return' ? 'Return Marks for Rework' : 'Reject Correction Request'}
        fields={[{ name: 'remarks', label: 'Remarks', type: 'textarea', required: true }]}
        values={{ remarks }}
        onChange={(_, v) => setRemarks(v)}
        onSubmit={handleModalSubmit}
        onClose={() => setModal(null)}
        submitLabel={modal?.kind === 'return' ? 'Return' : 'Reject'}
        isSubmitting={Boolean(busyId)}
      />
    </div>
  );
};

export default ResultPublishPage;
