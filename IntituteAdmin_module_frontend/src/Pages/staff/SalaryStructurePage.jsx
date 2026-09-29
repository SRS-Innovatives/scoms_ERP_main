import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, Edit3, Loader2 } from 'lucide-react';
import staffService from '../../services/staffService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = { basicPay: '', hra: '', da: '', otherAllowances: '', deductions: '' };

export const SalaryStructurePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getSalaries()
      .then((res) => setStaff(res.data || []))
      .catch((err) => { notifyError(`Failed to load salary structures: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = (row) => {
    setTargetId(row.id);
    setForm({
      basicPay: String(row.salary?.basicPay || ''),
      hra: String(row.salary?.hra || ''),
      da: String(row.salary?.da || ''),
      otherAllowances: String(row.salary?.otherAllowances || ''),
      deductions: String(row.salary?.deductions || ''),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffService.setSalary(targetId, form);
      notifySuccess('Salary structure saved successfully!');
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save salary structure: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Emp ID', key: 'employeeCode', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Staff Name', key: 'firstName', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</span> },
    { header: 'Role', key: 'designation' },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '—' },
    { header: 'Basic Pay', key: 'salary', sortable: false, render: (val) => <span className="font-mono">₹{(val?.basicPay || 0).toLocaleString()}</span> },
    { header: 'HRA + DA + Allowances', key: 'salary2', sortable: false, render: (_, row) => <span className="font-mono text-emerald-600">+₹{((row.salary?.hra || 0) + (row.salary?.da || 0) + (row.salary?.otherAllowances || 0)).toLocaleString()}</span> },
    { header: 'Deductions', key: 'salary3', sortable: false, render: (_, row) => <span className="font-mono text-rose-600">−₹{(row.salary?.deductions || 0).toLocaleString()}</span> },
    { header: 'Gross Salary (Monthly)', key: 'grossSalary', render: (val) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{val.toLocaleString()}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <button onClick={() => openModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      ),
    },
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Salary Structure & Payroll Matrix</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Basic, HRA, DA, allowances and deductions per staff member</p>
      </div>

      <DataTable columns={columns} data={staff} />

      <FormModal
        isOpen={modalOpen}
        title="Set Salary Structure"
        icon={CreditCard}
        submitLabel="Save"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'basicPay', label: 'Basic Pay (₹)', type: 'number', required: true },
          { name: 'hra', label: 'HRA (₹)', type: 'number' },
          { name: 'da', label: 'DA (₹)', type: 'number' },
          { name: 'otherAllowances', label: 'Other Allowances (₹)', type: 'number' },
          { name: 'deductions', label: 'Deductions (₹)', type: 'number' },
        ]}
      />
    </div>
  );
};

export default SalaryStructurePage;
