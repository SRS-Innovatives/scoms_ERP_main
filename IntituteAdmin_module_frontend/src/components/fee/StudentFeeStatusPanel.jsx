import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Wallet, ArrowRightLeft, Undo2, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import feePolicyService from '../../services/feePolicyService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const input = 'mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';

/**
 * One student's Fee Policy status at the counter: holds now in force (and why), and their
 * fee credit with Use / Refund / Move to sibling. `refreshKey` reloads it after a payment;
 * `onChanged` lets the page reload its fee list after credit is used.
 */
export const StudentFeeStatusPanel = ({ studentId, refreshKey = 0, onChanged }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [data, setData] = useState(null);
  const [action, setAction] = useState(null); // 'use' | 'refund' | 'transfer'
  const [form, setForm] = useState({ amount: '', reason: '', toStudentId: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!studentId) return;
    feePolicyService.getStudentStatus(studentId).then((r) => setData(r.data)).catch(() => setData(null));
  }, [studentId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (!data) return null;
  const { holds, credit } = data;
  const held = holds.holds || [];
  if (held.length === 0 && !(credit.balance > 0) && !(holds.exemptTypes || []).length) return null;

  const open = (kind) => { setAction(kind); setForm({ amount: String(credit.balance), reason: '', toStudentId: credit.siblings?.[0]?.id || '' }); };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const amount = Number(form.amount);
      const res = action === 'use' ? await feePolicyService.useCredit(studentId, { amount })
        : action === 'refund' ? await feePolicyService.refundCredit(studentId, { amount, reason: form.reason })
          : await feePolicyService.transferCredit(studentId, { amount, reason: form.reason, toStudentId: form.toStudentId });
      notifySuccess(res.message);
      setAction(null);
      load();
      onChanged?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {(held.length > 0 || (holds.exemptTypes || []).length > 0) && (
        <div className={`p-4 rounded-2xl border text-xs ${held.length ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}>
          <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300"><ShieldAlert className="w-4 h-4" /> {held.length ? 'On fee hold' : 'Hold exempted'}</p>
          {held.length > 0 && <p className="mt-1 text-slate-700 dark:text-slate-300">Blocked: {held.map((h) => holds.labels?.[h] || h).join(', ')}. Paying {inr(holds.amountToClear)} releases it.</p>}
          {(holds.exemptTypes || []).length > 0 && <p className="mt-1 text-amber-700 dark:text-amber-300">Exempted: {holds.exemptTypes.join(', ').toLowerCase().replace(/_/g, ' ')}</p>}
        </div>
      )}
      {credit.balance > 0 && (
        <div className="p-4 rounded-2xl border text-xs bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300"><Wallet className="w-4 h-4" /> Fee credit: {inr(credit.balance)}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button type="button" onClick={() => open('use')} className="px-2.5 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Pay dues from credit</button>
            {credit.canRefund && <button type="button" onClick={() => open('refund')} className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold bg-white dark:bg-slate-800 rounded-lg"><Undo2 className="w-3 h-3" /> Refund</button>}
            {credit.canTransfer && credit.siblings?.length > 0 && <button type="button" onClick={() => open('transfer')} className="inline-flex items-center gap-1 px-2.5 py-1.5 font-semibold bg-white dark:bg-slate-800 rounded-lg"><ArrowRightLeft className="w-3 h-3" /> Move to sibling</button>}
          </div>
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && setAction(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {action === 'use' ? 'Pay dues from credit' : action === 'refund' ? 'Refund credit' : 'Move credit to a sibling'}
            </h3>
            <p className="text-xs text-slate-500">Credit balance {inr(credit.balance)}{action === 'use' ? ' — the oldest unpaid fee is paid first, each with its own receipt.' : ''}</p>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Amount (₹)
              <input type="number" min="0.01" step="0.01" max={credit.balance} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} />
            </label>
            {action === 'transfer' && (
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sibling
                <select value={form.toStudentId} onChange={(e) => setForm({ ...form, toStudentId: e.target.value })} className={input}>
                  {credit.siblings.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
                </select>
              </label>
            )}
            {action !== 'use' && (
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Reason {action === 'refund' ? '(required)' : '(optional)'}
                <input required={action === 'refund'} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={input} />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentFeeStatusPanel;
