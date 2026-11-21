import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlarmClock, Wallet, XCircle } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import lateFeeService from '../../services/lateFeeService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const MODES = [['CASH', 'Cash'], ['UPI_MANUAL', 'UPI'], ['CHEQUE', 'Cheque'], ['DD', 'DD'], ['BANK_TRANSFER', 'Bank transfer'], ['OTHER', 'Other']];

/**
 * Late fees — charged automatically per each fee structure's rule (₹ per day after the grace
 * days, up to the maximum). Kept separate from the fee itself. Only the Institute Admin
 * collects (with a receipt number) or waives (with a reason) them.
 */
export const LateFeesPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [status, setStatus] = useState('DUE');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [action, setAction] = useState(null); // { kind: 'collect' | 'waive', row }
  const [form, setForm] = useState({ amount: '', paymentMode: 'CASH', text: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    lateFeeService.getAll(status)
      .then((res) => setRows(res.data || []))
      .catch((err) => { notifyError(`Failed to load late fees: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [status, notifyError]);

  useEffect(() => { load(); }, [load]);

  const open = (kind, row) => { setAction({ kind, row }); setForm({ amount: String(row.due), paymentMode: 'CASH', text: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    const { kind, row } = action;
    setBusy(true);
    try {
      const res = kind === 'collect'
        ? await lateFeeService.collect(row.assignmentId, { amount: Number(form.amount), paymentMode: form.paymentMode, remarks: form.text || undefined })
        : await lateFeeService.waive(row.assignmentId, { amount: Number(form.amount), reason: form.text });
      notifySuccess(kind === 'collect' ? `Collected — receipt ${res.data?.entry?.receiptNumber || ''}` : 'Late fee waived');
      setAction(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalDue = rows.reduce((s, r) => s + r.due, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Late Fees</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Charged automatically after each fee structure's grace days, up to its maximum. Collect or waive them here.</p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {[['DUE', 'Due'], ['ALL', 'All with a late fee']].map(([key, label]) => (
            <button key={key} onClick={() => setStatus(key)} className={`px-3 py-1.5 rounded-lg ${status === key ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title={status === 'DUE' ? 'No late fees due' : 'No late fees'} description="Late fees appear here once a fee is overdue past its grace days." icon={AlarmClock} />
      ) : (
        <>
          {status === 'DUE' && <p className="text-sm font-bold text-slate-900 dark:text-white">Total late fee due: {inr(totalDue)} from {rows.length} fee(s)</p>}
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="p-3">Student</th><th className="p-3">Fee</th><th className="p-3">Rule</th>
                  <th className="p-3 text-right">Days late</th><th className="p-3 text-right">Charged</th><th className="p-3 text-right">Waived</th>
                  <th className="p-3 text-right">Paid</th><th className="p-3 text-right">Due</th><th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.assignmentId}>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">{r.student?.firstName} {r.student?.lastName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{r.student?.admissionNumber}{r.student?.rollNumber ? ` · Roll ${r.student.rollNumber}` : ''}</p>
                    </td>
                    <td className="p-3">{r.feeName}<p className="text-[10px] text-slate-500">fee still due {inr(r.feeDue)}</p></td>
                    <td className="p-3 text-[11px] text-slate-500">{inr(r.rule.perDay)}/day after {r.rule.graceDays} day(s){r.rule.max !== null ? `, max ${inr(r.rule.max)}` : ''}</td>
                    <td className="p-3 text-right font-mono">{r.daysLate || '—'}</td>
                    <td className="p-3 text-right font-mono">{inr(r.charged)}</td>
                    <td className="p-3 text-right font-mono">{inr(r.waived)}</td>
                    <td className="p-3 text-right font-mono">{inr(r.paid)}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">{inr(r.due)}</td>
                    <td className="p-3 text-right">
                      {r.due > 0 && (
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => open('collect', r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"><Wallet className="w-3 h-3" /> Collect</button>
                          <button onClick={() => open('waive', r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg"><XCircle className="w-3 h-3" /> Waive</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {action && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && setAction(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {action.kind === 'collect' ? 'Collect late fee' : 'Waive late fee'} — {action.row.student?.firstName} {action.row.student?.lastName}
            </h3>
            <p className="text-xs text-slate-500">{action.row.feeName} · late fee due {inr(action.row.due)}</p>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Amount (₹)
              <input type="number" min="0.01" step="0.01" max={action.row.due} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </label>
            {action.kind === 'collect' && (
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Payment mode
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              {action.kind === 'collect' ? 'Remarks (optional)' : 'Reason for waiving (required)'}
              <input required={action.kind === 'waive'} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button type="submit" disabled={busy} className={`px-4 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-60 ${action.kind === 'collect' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {busy ? 'Saving…' : action.kind === 'collect' ? 'Collect' : 'Waive'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LateFeesPage;
