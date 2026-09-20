import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Plus, Trash2, Loader2, CalendarClock } from 'lucide-react';
import feeService from '../../services/feeService';

export const InstallmentManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [installments, setInstallments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [assignmentId, setAssignmentId] = useState('');
  const [parts, setParts] = useState([{ amount: '', dueDate: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    Promise.all([feeService.getInstallments(), feeService.getAssignments({ status: 'PENDING' })])
      .then(([instRes, assignRes]) => {
        setInstallments(instRes.data || []);
        setAssignments(assignRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load installments: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAssignment = assignments.find((a) => a.id === assignmentId);

  const addPart = () => setParts((prev) => [...prev, { amount: '', dueDate: '' }]);
  const removePart = (idx) => setParts((prev) => prev.filter((_, i) => i !== idx));
  const updatePart = (idx, field, value) => setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));

  const planTotal = parts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleCreatePlan = async () => {
    if (!assignmentId || parts.some((p) => !p.amount || !p.dueDate)) {
      notifyError('Select a student assignment and fill every installment amount + due date.');
      return;
    }
    setSubmitting(true);
    try {
      await feeService.createInstallmentPlan({ studentFeeAssignmentId: assignmentId, installments: parts });
      notifySuccess('Installment plan created successfully!');
      setAssignmentId('');
      setParts([{ amount: '', dueDate: '' }]);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create installment plan: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Student', key: 'studentFeeAssignment', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.student?.firstName} {val?.student?.lastName}</span> },
    { header: 'Roll No', key: 'studentFeeAssignment2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.studentFeeAssignment?.student?.rollNumber}</span> },
    { header: 'Fee Structure', key: 'studentFeeAssignment3', sortable: false, render: (_, row) => row.studentFeeAssignment?.feeStructure?.name },
    { header: 'Installment', key: 'installmentNumber', sortable: false, render: (val) => `Part ${val}` },
    { header: 'Amount (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Paid (₹)', key: 'paidAmount', render: (val) => <span className="font-mono text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Installment Plan Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Split a student's outstanding due amount into a multi-part installment schedule</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Installment Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
            <option value="">Select a pending fee assignment...</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.student?.rollNumber} — {a.student?.firstName} {a.student?.lastName} ({a.feeStructure?.name}, due ₹{a.dueAmount.toLocaleString()})
              </option>
            ))}
          </select>
          {selectedAssignment && (
            <p className="flex items-center text-slate-500">Outstanding due: <b className="ml-1 text-slate-900 dark:text-white">₹{selectedAssignment.dueAmount.toLocaleString()}</b></p>
          )}
        </div>

        <div className="space-y-2">
          {parts.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-16 font-bold text-slate-500">Part {idx + 1}</span>
              <input type="number" placeholder="Amount (₹)" value={p.amount} onChange={(e) => updatePart(idx, 'amount', e.target.value)} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
              <input type="date" value={p.dueDate} onChange={(e) => updatePart(idx, 'dueDate', e.target.value)} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              {parts.length > 1 && (
                <button onClick={() => removePart(idx)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
          <button onClick={addPart} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"><Plus className="w-3.5 h-3.5" /> Add Installment</button>
        </div>

        {selectedAssignment && (
          <p className={`text-xs font-semibold ${Math.abs(planTotal - selectedAssignment.dueAmount) > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Plan total: ₹{planTotal.toLocaleString()} {Math.abs(planTotal - selectedAssignment.dueAmount) > 1 ? `(must equal ₹${selectedAssignment.dueAmount.toLocaleString()})` : '✓ matches outstanding due'}
          </p>
        )}

        <button onClick={handleCreatePlan} disabled={submitting} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
          <CalendarClock className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Installment Plan'}
        </button>
      </div>

      {installments.length === 0 ? (
        <EmptyState title="No Installment Plans Yet" description="Create a plan above to split a student's due amount into parts." />
      ) : (
        <DataTable columns={columns} data={installments} />
      )}
    </div>
  );
};

export default InstallmentManagementPage;
