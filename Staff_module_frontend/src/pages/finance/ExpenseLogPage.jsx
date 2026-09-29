import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, Loader2, X, Save, Trash2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import expenseService from '../../services/expenseService';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = ['UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'EVENTS', 'MARKETING', 'PROFESSIONAL_FEES', 'SALARY_ADVANCE', 'OTHER'];
const emptyForm = { category: 'OTHER', title: '', description: '', amount: '', expenseDate: '' };

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  APPROVED: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400',
};

export const ExpenseLogPage = () => {
  const { success, error: showError } = useNotification();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([expenseService.getExpenses(), expenseService.getSummary()])
      .then(([expRes, sumRes]) => { setExpenses(expRes.data || []); setSummary(sumRes.data); })
      .catch((err) => { showError(err.message || 'Failed to load expenses', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expenseService.createExpense({ ...form, amount: Number(form.amount) });
      success('Expense logged successfully.');
      setFormOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to log expense', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expenseService.deleteExpense(confirming.id);
      success('Expense deleted.');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to delete expense', 'Delete Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Expense Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log institution operating expenses for Institute Admin approval</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([status, s]) => (
            <div key={status} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_STYLES[status.toUpperCase()] || ''}`}>{status}</span>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">₹{(s.amount || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-500">{s.count} expense(s)</p>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Receipt className="w-4 h-4 text-sky-500" /> New Expense</h3>
            <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                <input type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Date</label>
                <input type="date" required value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
                <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Log Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <EmptyState title="No Expenses Logged" message="Log your first operating expense above." icon={Receipt} />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                <tr>
                  <th className="text-left p-3 font-semibold">Title</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{e.title}</td>
                    <td className="p-3 text-slate-500">{e.category.replace('_', ' ')}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">₹{e.amount}</td>
                    <td className="p-3 text-slate-500">{new Date(e.expenseDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[9px] font-bold ${STATUS_STYLES[e.status]}`}>{e.status}</span></td>
                    <td className="p-3">
                      {e.status === 'PENDING' && (
                        <button onClick={() => setConfirming(e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        message={confirming ? `"${confirming.title}" will be permanently removed.` : ''}
      />
    </div>
  );
};

export default ExpenseLogPage;
