import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import SummaryCard from '../../components/common/SummaryCard';
import Tabs from '../../components/common/Tabs';
import { useNotification } from '../../context/NotificationContext';
import { Wallet, CheckCircle2, XCircle, IndianRupee, Trash2, PiggyBank } from 'lucide-react';
import expenseService from '../../services/expenseService';
import budgetService from '../../services/budgetService';

const CATEGORIES = [
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'SALARY_ADVANCE', label: 'Salary Advance' },
  { value: 'OTHER', label: 'Other' },
];

const emptyExpenseForm = { category: 'OTHER', title: '', description: '', amount: '', expenseDate: '' };
const emptyBudgetForm = { category: 'OTHER', period: '', allocatedAmount: '' };

export const ExpenseManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('expenses');
  const [search, setSearch] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    Promise.all([expenseService.getExpenses(), expenseService.getSummary()])
      .then(([expRes, sumRes]) => { setExpenses(expRes.data || []); setSummary(sumRes.data); })
      .catch((err) => notifyError(`Failed to load expenses: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const fetchBudgets = useCallback(() => {
    setLoading(true);
    budgetService.getBudgets()
      .then((res) => setBudgets(res.data || []))
      .catch((err) => notifyError(`Failed to load budgets: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { tab === 'expenses' ? fetchExpenses() : fetchBudgets(); }, [tab, fetchExpenses, fetchBudgets]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expenseService.createExpense({ ...expenseForm, amount: Number(expenseForm.amount) });
      notifySuccess(`"${expenseForm.title}" logged successfully!`);
      setModalOpen(false);
      setExpenseForm(emptyExpenseForm);
      fetchExpenses();
    } catch (error) {
      notifyError(`Failed to log expense: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await budgetService.saveBudget({ ...budgetForm, allocatedAmount: Number(budgetForm.allocatedAmount) });
      notifySuccess('Budget saved successfully!');
      setModalOpen(false);
      setBudgetForm(emptyBudgetForm);
      fetchBudgets();
    } catch (error) {
      notifyError(`Failed to save budget: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try { await expenseService.approveExpense(id); notifySuccess('Expense approved'); fetchExpenses(); }
    catch (err) { notifyError(err.message); }
  };
  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try { await expenseService.rejectExpense(id, reason); notifySuccess('Expense rejected'); fetchExpenses(); }
    catch (err) { notifyError(err.message); }
  };
  const handlePay = async (id) => {
    try { await expenseService.markPaid(id); notifySuccess('Marked as paid'); fetchExpenses(); }
    catch (err) { notifyError(err.message); }
  };
  const handleDeleteExpense = async (id) => {
    try { await expenseService.deleteExpense(id); notifySuccess('Expense deleted'); fetchExpenses(); }
    catch (err) { notifyError(err.message); }
  };
  const handleDeleteBudget = async (id) => {
    try { await budgetService.deleteBudget(id); notifySuccess('Budget deleted'); fetchBudgets(); }
    catch (err) { notifyError(err.message); }
  };

  const expenseColumns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Amount', key: 'amount', render: (val) => <span className="font-mono font-semibold">₹{val.toLocaleString('en-IN')}</span> },
    { header: 'Date', key: 'expenseDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'PENDING' && (
            <>
              <button onClick={() => handleApprove(id)} className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600" title="Approve"><CheckCircle2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleReject(id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDeleteExpense(id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button onClick={() => handlePay(id)} className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600" title="Mark Paid"><IndianRupee className="w-3.5 h-3.5" /></button>
          )}
        </div>
      ),
    },
  ];

  const budgetColumns = [
    { header: 'Category', key: 'category', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Period', key: 'period' },
    { header: 'Allocated', key: 'allocatedAmount', render: (val) => <span className="font-mono font-semibold">₹{val.toLocaleString('en-IN')}</span> },
    { header: 'Notes', key: 'notes', render: (val) => val || '—' },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id) => <button onClick={() => handleDeleteBudget(id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>,
    },
  ];

  const filteredExpenses = expenses.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Expense & Budget Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Log operating expenses with approval workflow, and plan budgets against them</p>
      </div>

      {tab === 'expenses' && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Pending" value={`₹${summary.pending.amount.toLocaleString('en-IN')}`} subtitle={`${summary.pending.count} expense(s)`} icon={Wallet} color="amber" />
          <SummaryCard title="Approved" value={`₹${summary.approved.amount.toLocaleString('en-IN')}`} subtitle={`${summary.approved.count} expense(s)`} icon={CheckCircle2} color="sky" />
          <SummaryCard title="Paid" value={`₹${summary.paid.amount.toLocaleString('en-IN')}`} subtitle={`${summary.paid.count} expense(s)`} icon={IndianRupee} color="emerald" />
          <SummaryCard title="Rejected" value={`₹${summary.rejected.amount.toLocaleString('en-IN')}`} subtitle={`${summary.rejected.count} expense(s)`} icon={XCircle} color="rose" />
        </div>
      )}

      <Tabs
        tabs={[{ id: 'expenses', label: 'Expenses', icon: Wallet }, { id: 'budgets', label: 'Budgets', icon: PiggyBank }]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'expenses' ? (
        <>
          <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search expenses..." addLabel="Log Expense" onAddClick={() => setModalOpen(true)} />
          {!loading && filteredExpenses.length === 0 ? (
            <EmptyState title="No Expenses Yet" description="Log the first institution expense." actionLabel="Log Expense" onAction={() => setModalOpen(true)} icon={Wallet} />
          ) : (
            <DataTable columns={expenseColumns} data={filteredExpenses} loading={loading} />
          )}
        </>
      ) : (
        <>
          <SearchFilterBar searchQuery="" onSearchChange={() => {}} placeholder="" addLabel="Set Budget" onAddClick={() => setModalOpen(true)} />
          {!loading && budgets.length === 0 ? (
            <EmptyState title="No Budgets Set" description="Allocate a budget per category and period." actionLabel="Set Budget" onAction={() => setModalOpen(true)} icon={PiggyBank} />
          ) : (
            <DataTable columns={budgetColumns} data={budgets} loading={loading} />
          )}
        </>
      )}

      {tab === 'expenses' ? (
        <FormModal
          isOpen={modalOpen}
          title="Log Expense"
          icon={Wallet}
          submitLabel="Log Expense"
          isSubmitting={submitting}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddExpense}
          values={expenseForm}
          onChange={(name, value) => setExpenseForm((prev) => ({ ...prev, [name]: value }))}
          fields={[
            { name: 'title', label: 'Title', required: true, span: 'full' },
            { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true },
            { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
            { name: 'expenseDate', label: 'Expense Date', type: 'date', required: true },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
          ]}
        />
      ) : (
        <FormModal
          isOpen={modalOpen}
          title="Set Budget"
          icon={PiggyBank}
          submitLabel="Save Budget"
          isSubmitting={submitting}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddBudget}
          values={budgetForm}
          onChange={(name, value) => setBudgetForm((prev) => ({ ...prev, [name]: value }))}
          fields={[
            { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true },
            { name: 'period', label: 'Period (e.g. 2026-27)', required: true },
            { name: 'allocatedAmount', label: 'Allocated Amount (₹)', type: 'number', required: true },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
          ]}
        />
      )}
    </div>
  );
};

export default ExpenseManagementPage;
