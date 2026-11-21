import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Award, Loader2, Gift, Send, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';
import feeService from '../../services/feeService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const STATUS = {
  PENDING: { label: 'Under review', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300', icon: Clock },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', icon: CheckCircle2 },
  REJECTED: { label: 'Not approved', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300', icon: XCircle },
  REVOKED: { label: 'Revoked', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: XCircle },
};
const describe = (s) => (s.valueType === 'PERCENT' ? `${s.value}% of the fee${s.maxAmount ? ` (max ${inr(s.maxAmount)})` : ''}` : `${inr(s.value)} off`);
// Same rule as the server (shared/fees/concession.js) — shown as an estimate only;
// the server always computes the real amount.
const estimate = (scheme, fee) => {
  if (!scheme || !fee) return null;
  const raw = scheme.valueType === 'PERCENT' ? (fee.totalAmount * scheme.value) / 100 : scheme.value;
  const capped = scheme.maxAmount ? Math.min(raw, scheme.maxAmount) : raw;
  const left = fee.totalAmount - fee.discountAmount;
  return Math.max(0, Math.round(Math.min(capped, fee.totalAmount, left) * 100) / 100);
};
const emptyForm = { schemeId: '', feeAssignmentId: '', reason: '', referenceNo: '' };

export const ScholarshipsPage = () => {
  const { error: showError, success: showSuccess } = useNotification();
  const [fees, setFees] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([feeService.getFees(), feeService.getConcessionSchemes(), feeService.getMyConcessions()])
      .then(([f, s, a]) => { setFees(f.data || []); setSchemes(s.data || []); setApplications(a.data || []); })
      .catch((err) => { showError(err.message || 'Failed to load scholarships', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const applied = useMemo(() => fees.filter((a) => a.discountAmount > 0), [fees]);
  const eligibleFees = useMemo(() => fees.filter((a) => a.totalAmount - a.discountAmount > 0), [fees]);
  const scheme = schemes.find((s) => s.id === form.schemeId);
  const fee = fees.find((f) => f.id === form.feeAssignmentId);
  const est = estimate(scheme, fee);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feeService.applyConcession(form);
      showSuccess?.('Application submitted — your class teacher will review it.', 'Submitted');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      showError(err.message || 'Could not submit your application', 'Not submitted');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error) return <ErrorState onRetry={load} />;

  const canApply = schemes.length > 0 && eligibleFees.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scholarships & Financial Aid"
        subtitle="Apply for a scholarship or fee concession, and track your applications. Your class teacher reviews each application."
        actionLabel={canApply ? 'Apply for Scholarship' : undefined}
        onAction={canApply ? () => setOpen(true) : undefined}
      />

      {!canApply && (
        <p className="text-xs text-slate-500 -mt-4">
          {schemes.length === 0 ? 'Your institution has no scholarship schemes open for applications right now.' : 'You have no fee on which a scholarship could be applied.'}
        </p>
      )}

      {/* My applications */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Applications</h3>
        {applications.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            You haven&apos;t applied for any scholarship yet.
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => {
              const st = STATUS[a.status] || STATUS.PENDING;
              const Icon = st.icon;
              return (
                <div key={a.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.scheme?.name}</p>
                    <p className="text-xs text-slate-500">{a.feeAssignment?.feeStructure?.name} · applied {new Date(a.createdAt).toLocaleDateString('en-IN')}{a.referenceNo ? ` · Ref ${a.referenceNo}` : ''}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{a.reason}</p>
                    {a.reviewRemarks && a.status !== 'PENDING' && (
                      <p className="text-xs mt-1"><span className="text-slate-500">Remarks:</span> <span className="text-slate-700 dark:text-slate-300">{a.reviewRemarks}</span></p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${st.cls}`}><Icon className="w-3 h-3" /> {st.label}</span>
                    <p className="text-sm font-bold text-emerald-600">{inr(a.amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Already applied to the account */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Applied to Your Account</h3>
        {applied.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <Gift className="w-7 h-7 text-slate-300" />
            No scholarships or fee concessions applied to your fees yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applied.map((sch) => (
              <div key={sch.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600"><Award className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{sch.scholarshipName || 'Fee Concession'}</h4>
                    <p className="text-xs text-slate-500">{sch.feeStructure?.name}{sch.scholarshipRef ? ` • Ref: ${sch.scholarshipRef}` : ''}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-500">Concession Value:</span>
                  <span className="font-bold text-emerald-600 text-sm">{inr(sch.discountAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Apply modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !submitting && setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply for a Scholarship</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Scheme
              <select required value={form.schemeId} onChange={(e) => setForm({ ...form, schemeId: e.target.value })} className="mt-1 w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                <option value="">Select a scheme…</option>
                {schemes.map((s) => <option key={s.id} value={s.id}>{s.name} — {describe(s)}</option>)}
              </select>
            </label>
            {scheme?.description && <p className="text-[11px] text-slate-500 -mt-2">{scheme.description}</p>}

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Fee it applies to
              <select required value={form.feeAssignmentId} onChange={(e) => setForm({ ...form, feeAssignmentId: e.target.value })} className="mt-1 w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                <option value="">Select a fee…</option>
                {eligibleFees.map((f) => <option key={f.id} value={f.id}>{f.feeStructure?.name || 'Fee'} — total {inr(f.totalAmount)}</option>)}
              </select>
            </label>

            {est !== null && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300">
                Estimated concession: <b>{inr(est)}</b> — applied to your fee once your class teacher approves.
              </div>
            )}

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Why are you eligible?
              <textarea required maxLength={1000} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. First-generation graduate; family income below the scheme limit" className="mt-1 w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs" />
            </label>

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Reference / certificate number <span className="font-normal text-slate-400">(optional)</span>
              <input maxLength={100} value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} placeholder="e.g. Govt sanction or certificate no." className="mt-1 w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs" />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
