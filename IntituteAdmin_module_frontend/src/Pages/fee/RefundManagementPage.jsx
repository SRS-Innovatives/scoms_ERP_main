import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Undo2, Plus, Check, X, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';

const emptyForm = { studentId: '', reason: '', amount: '', bankAccount: '' };

export const RefundManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [refunds, setRefunds] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([feeService.getRefunds(), studentService.getAll()])
      .then(([refundRes, studentRes]) => {
        setRefunds(refundRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load refunds: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feeService.createRefund(form);
      notifySuccess('Refund request recorded successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to record refund: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (id, status) => {
    setBusyId(id);
    try {
      await feeService.processRefund(id, status);
      notifySuccess(`Refund marked as ${status.toLowerCase()}.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update refund: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Roll No', key: 'student2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.student?.rollNumber}</span> },
    { header: 'Refund Reason', key: 'reason' },
    { header: 'Refund Amount (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-indigo-600">₹{val.toLocaleString()}</span> },
    { header: 'Bank A/C Details', key: 'bankAccount', render: (val) => <span className="font-mono text-xs">{val || '—'}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-1.5">
            <button disabled={busyId === id} onClick={() => handleProcess(id, 'PROCESSED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
            <button disabled={busyId === id} onClick={() => handleProcess(id, 'REJECTED')} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : null,
    },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Refund & Caution Deposit Returns</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Process caution deposit refunds, excess payments & admission cancellation refunds</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <Plus className="w-4 h-4" /> Record Refund Request
        </button>
      </div>

      {refunds.length === 0 ? (
        <EmptyState title="No Refund Requests Yet" description="Record the first refund request to get started." actionLabel="Record Refund Request" onAction={() => setModalOpen(true)} icon={Undo2} />
      ) : (
        <DataTable columns={columns} data={refunds} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Record Refund Request"
        icon={Undo2}
        submitLabel="Record Refund"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'reason', label: 'Refund Reason', required: true, span: 'full' },
          { name: 'amount', label: 'Refund Amount (₹)', type: 'number', required: true },
          { name: 'bankAccount', label: 'Bank A/C Details' },
        ]}
      />
    </div>
  );
};

export default RefundManagementPage;
