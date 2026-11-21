import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import feePolicyService from '../../services/feePolicyService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const MODE = { PRORATA: 'pro-rata for the months left', FULL: 'the full difference', NEXT_TERM: 'from next term' };

/**
 * "Recalculate fees" for one student: shows what the fee rules now give them (fees to assign,
 * heads to adjust after a quota / hostel / bus change) and applies it on confirm.
 */
export const RecalcStudentFees = ({ studentId, onChanged }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try { setPlan((await feePolicyService.previewStudentSync(studentId)).data); } catch (e) { notifyError(e.message); } finally { setBusy(false); }
  };
  const apply = async () => {
    setBusy(true);
    try {
      notifySuccess((await feePolicyService.applyStudentSync(studentId)).message);
      setPlan(null);
      onChanged?.();
    } catch (e) {
      notifyError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const nothing = plan && !plan.assign.length && !plan.adjust.length;

  return (
    <>
      <button type="button" onClick={open} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl disabled:opacity-50">
        {busy && !plan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Recalculate fees
      </button>
      {plan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && setPlan(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recalculate fees — {plan.student?.firstName} {plan.student?.lastName}</h3>
            {nothing && !plan.deferred.length && <p className="text-slate-500">Fees already match the fee rules. Nothing to change.</p>}
            {plan.assign.map((a) => (
              <div key={a.structureId} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">Assign {a.name} — {inr(a.total)}{a.scale < 1 ? ` (part year, full ${inr(a.fullTotal)})` : ''}</p>
                <p className="text-slate-600 dark:text-slate-400">{a.items.map((i) => `${i.feeHeadName} ${inr(i.amount)}`).join(', ')}</p>
              </div>
            ))}
            {plan.adjust.map((a) => (
              <div key={a.assignmentId} className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                <p className="font-bold text-indigo-700 dark:text-indigo-300">{a.name}: {inr(a.totalFrom)} → {inr(a.totalTo)}</p>
                {a.changes.map((c) => (
                  <p key={c.feeHeadId} className="text-slate-600 dark:text-slate-400">{c.feeHeadName}: {inr(c.from)} → {inr(c.to)}{c.note ? ` — ${c.note}` : ''}</p>
                ))}
              </div>
            ))}
            {plan.deferred.length > 0 && <p className="text-amber-700 dark:text-amber-400">Deferred to next term: {plan.deferred.map((d) => d.name).join(', ')}</p>}
            {!nothing && <p className="text-slate-500">Mid-year changes are charged {MODE[plan.mode] || plan.mode} (Fee Policy). Nothing already paid is reduced.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPlan(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Close</button>
              {!nothing && (
                <button type="button" onClick={apply} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Apply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecalcStudentFees;
