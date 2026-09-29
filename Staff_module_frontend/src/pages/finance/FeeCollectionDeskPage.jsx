import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Loader2, X, Save, Receipt, IndianRupee } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import feeDeskService from '../../services/feeDeskService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const emptyCollect = { studentId: '', studentFeeAssignmentId: '', amountPaid: '', paymentMode: 'CASH', transactionReference: '', remarks: '' };

export const FeeCollectionDeskPage = () => {
  const { success, error: showError } = useNotification();
  const [dashboard, setDashboard] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyCollect);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([feeDeskService.getDashboard(), feeDeskService.getPendingFees()])
      .then(([dashRes, pendingRes]) => {
        setDashboard(dashRes.data);
        setPending(pendingRes.data || []);
      })
      .catch((err) => { showError(err.message || 'Failed to load fee desk', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCollect = (assignment) => {
    setForm({
      studentId: assignment.studentId,
      studentFeeAssignmentId: assignment.id,
      amountPaid: assignment.dueAmount || '',
      paymentMode: 'CASH',
      transactionReference: '',
      remarks: '',
    });
    setLastReceipt(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await feeDeskService.collectFee({ ...form, amountPaid: Number(form.amountPaid) });
      setLastReceipt(res.data?.receipt);
      success('Fee collected and receipt generated.');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to collect fee', 'Collection Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fee Collection Desk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Collect student fee payments and issue receipts</p>
        </div>
        <button onClick={() => { setForm(emptyCollect); setLastReceipt(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Collect Payment
        </button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Collected Today', value: dashboard.collectedToday, icon: IndianRupee },
            { label: 'Collected This Month', value: dashboard.collectedThisMonth, icon: IndianRupee },
            { label: 'Total Outstanding', value: dashboard.totalOutstanding, icon: Wallet },
            { label: 'Total Collected (All Time)', value: dashboard.totalCollected, icon: Receipt },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <s.icon className="w-4 h-4 text-sky-500 mb-2" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₹{(s.value || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Wallet className="w-4 h-4 text-sky-500" /> Collect Fee Payment</h3>
            <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          {lastReceipt ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Receipt #{lastReceipt.receiptNumber}</p>
              <p className="text-emerald-600 dark:text-emerald-500">Amount ₹{lastReceipt.amount} recorded successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                  <input type="text" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="Paste from Pending Fees list below"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Assignment ID</label>
                  <input type="text" required value={form.studentFeeAssignmentId} onChange={(e) => setForm({ ...form, studentFeeAssignmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid (₹)</label>
                  <input type="number" min="1" required value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                    {['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Reference</label>
                  <input type="text" value={form.transactionReference} onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                  <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
                  <Save className="w-4 h-4" /> {submitting ? 'Collecting...' : 'Collect & Generate Receipt'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pending Fee Assignments</h3>
        </div>
        {pending.length === 0 ? (
          <EmptyState title="No Pending Fees" message="Every assigned fee has been fully collected." icon={Wallet} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                <tr>
                  <th className="text-left p-3 font-semibold">Student</th>
                  <th className="text-left p-3 font-semibold">Fee</th>
                  <th className="text-left p-3 font-semibold">Due</th>
                  <th className="text-left p-3 font-semibold">Student ID</th>
                  <th className="text-left p-3 font-semibold">Assignment ID</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{a.student?.firstName} {a.student?.lastName} <span className="text-slate-400 font-normal">({a.student?.rollNumber})</span></td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{a.feeStructure?.name}</td>
                    <td className="p-3 font-bold text-rose-600">₹{a.dueAmount}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{a.studentId}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{a.id}</td>
                    <td className="p-3">
                      <button onClick={() => openCollect(a)} className="px-3 py-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 rounded-lg hover:bg-sky-100">
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeCollectionDeskPage;
