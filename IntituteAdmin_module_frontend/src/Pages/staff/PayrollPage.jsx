import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import payrollService from '../../services/payrollService';
import staffService from '../../services/staffService';
import { Wallet, CheckCircle2, Trash2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const now = new Date();
const emptyForm = { staffId: '', month: now.getMonth() + 1, year: now.getFullYear(), leaveDeduction: 0 };

export const PayrollPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [payslips, setPayslips] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [payslipsRes, staffRes] = await Promise.all([payrollService.getAll(), staffService.getAll()]);
      setPayslips(payslipsRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (error) {
      notifyError(`Failed to load payroll: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollService.generate({ ...form, month: parseInt(form.month, 10), year: parseInt(form.year, 10), leaveDeduction: parseFloat(form.leaveDeduction) || 0 });
      notifySuccess('Payslip generated successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to generate payslip: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (row) => {
    try {
      await payrollService.markPaid(row.id);
      notifySuccess('Payslip marked as paid');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await payrollService.remove(deleteTarget.id);
      notifySuccess('Payslip deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Staff', key: 'staff',
      render: (val) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</p>
          <p className="text-[10px] text-slate-400">{val?.employeeCode} · {val?.designation}</p>
        </div>
      ),
    },
    { header: 'Period', key: 'month', render: (val, row) => `${MONTHS[val - 1]} ${row.year}` },
    { header: 'Basic', key: 'basicPay', render: (val) => `₹${val.toLocaleString('en-IN')}` },
    { header: 'Deductions', key: 'deductions', render: (val, row) => `₹${(val + row.leaveDeduction).toLocaleString('en-IN')}` },
    { header: 'Net Pay', key: 'netPay', render: (val) => <span className="font-bold text-emerald-600">₹{val.toLocaleString('en-IN')}</span> },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${val === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'}`}>
          {val}
        </span>
      ),
    },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status !== 'PAID' && (
            <button onClick={() => handleMarkPaid(row)} title="Mark Paid" className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          {row.status !== 'PAID' && (
            <button onClick={() => setDeleteTarget(row)} title="Delete" className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filtered = payslips.filter((p) =>
    `${p.staff?.firstName} ${p.staff?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payroll</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Generate monthly payslips from each staff member's real salary structure</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by staff name..."
        addLabel="Generate Payslip"
        onAddClick={() => setModalOpen(true)}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Payslips Generated" description="Generate a payslip for a staff member from their salary structure." actionLabel="Generate Payslip" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Generate Payslip"
        subtitle="Pulled from the staff member's Salary Structure — set up under Staff Management first"
        icon={Wallet}
        submitLabel="Generate"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'staffId', label: 'Staff Member', type: 'select', required: true, span: 'full', options: staffList.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.employeeCode})` })) },
          { name: 'month', label: 'Month', type: 'select', required: true, options: MONTHS.map((m, i) => ({ value: i + 1, label: m })) },
          { name: 'year', label: 'Year', type: 'number', required: true },
          { name: 'leaveDeduction', label: 'Leave Deduction (₹, optional)', type: 'number' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Payslip"
        message="Are you sure you want to delete this payslip? This cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PayrollPage;
