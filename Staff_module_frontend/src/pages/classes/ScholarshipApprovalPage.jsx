import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Inbox, Award } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import ErrorState from '../../components/common/ErrorState';
import scholarshipApprovalService from '../../services/scholarshipApprovalService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  REVOKED: 'bg-slate-100 text-slate-600',
};

/**
 * Scholarship / concession applications from students of the classes this teacher is
 * class teacher of. Approving applies the concession to the student's fee straight away;
 * the Institute Admin is kept informed. Rejecting needs a reason (shown to the student).
 */
export const ScholarshipApprovalPage = () => {
  const academic = useAcademic();
  const { success, error: showError } = useNotification();
  const [status, setStatus] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acting, setActing] = useState(null);
  const [rejecting, setRejecting] = useState(null); // application being rejected
  const [remarks, setRemarks] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    scholarshipApprovalService.getAll(status)
      .then((res) => setItems(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load applications', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [status, showError]);

  useEffect(() => { load(); }, [load]);

  const decide = async (app, decision, why) => {
    setActing(app.id);
    try {
      await scholarshipApprovalService.review(app.id, decision, why);
      success(decision === 'APPROVE' ? `Approved — ${inr(app.amount)} applied to the student's fee.` : 'Application rejected — the student has been told why.', 'Updated');
      setRejecting(null);
      setRemarks('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to update the application', 'Update Failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Scholarship Approvals</h3>
          <p className="text-xs text-slate-500">
            Scholarship and fee-concession applications from students of your {academic.label('section').toLowerCase()}. As {academic.label('classTeacher').toLowerCase()}, your approval applies the concession to the fee; the institution office is kept informed.
          </p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg ${status === s ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm' : 'text-slate-500'}`}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" />
          {status === 'PENDING' ? 'No scholarship applications waiting for you.' : `No ${status.toLowerCase()} applications.`}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex flex-wrap items-start gap-3">
                <span className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600"><Award className="w-5 h-5" /></span>
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {a.student?.firstName} {a.student?.lastName}
                    <span className="ml-2 text-[11px] font-mono font-normal text-slate-500">{a.student?.admissionNumber}{a.student?.rollNumber ? ` · Roll ${a.student.rollNumber}` : ''} · {a.student?.section?.name}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5"><b>{a.scheme?.name}</b> on {a.feeAssignment?.feeStructure?.name} (fee {inr(a.feeAssignment?.totalAmount)})</p>
                  <p className="text-xs text-slate-500 mt-1">“{a.reason}”{a.referenceNo ? ` · Ref ${a.referenceNo}` : ''}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Applied {new Date(a.createdAt).toLocaleDateString('en-IN')}</p>
                  {a.reviewRemarks && a.status !== 'PENDING' && <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">Remarks: {a.reviewRemarks}</p>}
                </div>
                <div className="text-right space-y-2">
                  <p className="text-lg font-black text-emerald-600">{inr(a.amount)}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                </div>
              </div>

              {a.status === 'PENDING' && (
                rejecting === a.id ? (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <input
                      autoFocus
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Reason for rejecting (shown to the student)"
                      className="flex-1 min-w-[220px] px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                    <button disabled={!remarks.trim() || acting === a.id} onClick={() => decide(a, 'REJECT', remarks)} className="px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">Confirm reject</button>
                    <button onClick={() => { setRejecting(null); setRemarks(''); }} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button disabled={acting === a.id} onClick={() => decide(a, 'APPROVE')} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                      {acting === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button disabled={acting === a.id} onClick={() => { setRejecting(a.id); setRemarks(''); }} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScholarshipApprovalPage;
