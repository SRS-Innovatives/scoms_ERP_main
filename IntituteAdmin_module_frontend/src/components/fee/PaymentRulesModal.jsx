import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import feePolicyService from '../../services/feePolicyService';

const field = 'mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';
const label = 'block text-xs font-semibold text-slate-600 dark:text-slate-300';
const FOLLOW = '';

/**
 * One fee structure's own payment rules (FeeStructure.policyOverride) — anything left on
 * "Follow the Fee Policy" uses the institution's policy. Editable on any structure, even a
 * published one, because these are rules for collecting it, not its amounts.
 */
const Select = ({ k, title, options, form, set }) => (
  <label className={label}>{title}
    <select value={form[k]} onChange={(e) => set(k, e.target.value)} className={field}>
      <option value={FOLLOW}>Follow the Fee Policy</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);

export const PaymentRulesModal = ({ structure, onClose, onSaved, onError }) => {
  const o = structure.policyOverride || {};
  const [form, setForm] = useState({
    partialPayment: o.partialPayment ?? FOLLOW,
    minPaymentType: o.minPaymentType ?? FOLLOW,
    minPaymentValue: o.minPaymentValue ?? '',
    lateFeeOrder: o.lateFeeOrder ?? FOLLOW,
    countsForHolds: o.countsForHolds === undefined ? FOLLOW : String(o.countsForHolds),
    remindersEnabled: o.remindersEnabled === undefined ? FOLLOW : String(o.remindersEnabled),
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (clear = false) => {
    setBusy(true);
    try {
      let override = null;
      if (!clear) {
        override = {};
        if (form.partialPayment) override.partialPayment = form.partialPayment;
        if (form.minPaymentType) {
          override.minPaymentType = form.minPaymentType;
          if (form.minPaymentType !== 'NONE') override.minPaymentValue = Number(form.minPaymentValue) || 0;
        }
        if (form.lateFeeOrder) override.lateFeeOrder = form.lateFeeOrder;
        if (form.countsForHolds) override.countsForHolds = form.countsForHolds === 'true';
        if (form.remindersEnabled) override.remindersEnabled = form.remindersEnabled === 'true';
        if (Object.keys(override).length === 0) override = null;
      }
      const res = await feePolicyService.setStructurePolicy(structure.id, override);
      onSaved(res.message);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment rules — {structure.name}</h3>
          <p className="text-xs text-slate-500">Only for this fee. Anything on "Follow the Fee Policy" uses Fees → Fee Policy.</p>
        </div>
        <Select form={form} set={set} k="partialPayment" title="Part payments" options={[['ALLOWED', 'Allowed'], ['NOT_ALLOWED', 'Whole instalments only'], ['COUNTER_ONLY', 'Only at the counter']]} />
        <div className="grid grid-cols-2 gap-3">
          <Select form={form} set={set} k="minPaymentType" title="Minimum payment" options={[['NONE', 'No minimum'], ['FIXED', 'Fixed ₹'], ['PERCENT', '% of next instalment']]} />
          {(form.minPaymentType === 'FIXED' || form.minPaymentType === 'PERCENT') && (
            <label className={label}>{form.minPaymentType === 'FIXED' ? 'Minimum (₹)' : 'Minimum (%)'}
              <input type="number" min="0" value={form.minPaymentValue} onChange={(e) => set('minPaymentValue', e.target.value)} className={field} />
            </label>
          )}
        </div>
        <Select form={form} set={set} k="lateFeeOrder" title="Late fee" options={[['SEPARATE', 'Collected separately'], ['FIRST', 'Paid first'], ['LAST', 'Paid last']]} />
        <Select form={form} set={set} k="countsForHolds" title="Counts towards fee holds" options={[['true', 'Yes'], ['false', 'No — never blocks anything']]} />
        <Select form={form} set={set} k="remindersEnabled" title="Reminders for this fee" options={[['true', 'Send'], ['false', 'Never send']]} />
        <div className="flex justify-between gap-2 pt-1">
          <button type="button" disabled={busy} onClick={() => save(true)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Reset to policy</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
            <button type="button" disabled={busy} onClick={() => save(false)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRulesModal;
