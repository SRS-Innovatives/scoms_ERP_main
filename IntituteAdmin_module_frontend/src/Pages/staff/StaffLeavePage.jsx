import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Clock, Plus, Check, X } from 'lucide-react';
import staffService from '../../services/staffService';

const emptyForm = { staffId: '', startDate: '', endDate: '', reason: '' };

export const StaffLeavePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([staffService.getLeaveRequests(), staffService.getAll()])
      .then(([leaveRes, staffRes]) => {
        setLeaves(leaveRes.data || []);
        setStaff(staffRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load leave applications: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffService.createLeaveRequest(form);
      notifySuccess('Leave application submitted successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to submit leave application: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (id, status) => {
    setBusyId(id);
    try {
      await staffService.updateLeaveStatus(id, status);
      notifySuccess(`Leave application ${status.toLowerCase()}.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update leave: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = leaves.filter((l) => {
    const name = `${l.staff?.employeeCode || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const columns = [
    { header: 'Emp ID', key: 'staff', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.employeeCode}</span> },
    { header: 'Staff', key: 'staff2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.staff?.firstName} {row.staff?.lastName}</span> },
    { header: 'Designation', key: 'staff3', sortable: false, render: (_, row) => row.staff?.designation },
    { header: 'Dates', key: 'startDate', sortable: false, render: (_, row) => <span className="font-mono">{new Date(row.startDate).toLocaleDateString('en-IN')} – {new Date(row.endDate).toLocaleDateString('en-IN')}</span> },
    { header: 'Reason', key: 'reason' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Action', key: 'id', sortable: false,
      render: (id, row) => row.status === 'PENDING' && (
        <div className="flex gap-1.5">
          <button disabled={busyId === id} onClick={() => handleDecision(id, 'APPROVED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
          <button disabled={busyId === id} onClick={() => handleDecision(id, 'REJECTED')} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"><X className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Leave Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Leave applications and approvals for teaching & non-teaching staff</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by employee code..." />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Leave Applications" description="Submit the first leave application to get started." actionLabel="Apply for Leave" onAction={() => setModalOpen(true)} icon={Clock} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Apply for Leave"
        icon={Clock}
        submitLabel="Submit Application"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'staffId', label: 'Staff Member', type: 'select', required: true, span: 'full', options: staff.map((s) => ({ value: s.id, label: `${s.employeeCode} — ${s.firstName} ${s.lastName}` })) },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'reason', label: 'Reason', required: true, span: 'full' },
        ]}
      />
    </div>
  );
};

export default StaffLeavePage;
