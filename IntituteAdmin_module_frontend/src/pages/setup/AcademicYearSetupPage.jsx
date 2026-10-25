import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import academicYearService from '../../services/academicYearService';
import { Calendar, CheckCircle, Edit, Trash2 } from 'lucide-react';

const deriveStatus = (year) => {
  if (year.isCurrent) return 'Active';
  return new Date(year.endDate) < new Date() ? 'Completed' : 'Upcoming';
};

const emptyForm = { yearName: '', startDate: '', endDate: '', isCurrent: false };

export const AcademicYearSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await academicYearService.getAll();
      setYears(res.data || []);
    } catch (error) {
      notifyError(`Failed to load academic years: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({
      yearName: row.yearName,
      startDate: row.startDate?.slice(0, 10),
      endDate: row.endDate?.slice(0, 10),
      isCurrent: row.isCurrent,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await academicYearService.update(editingId, form);
        notifySuccess(`Academic Year ${form.yearName} updated successfully!`);
      } else {
        await academicYearService.create(form);
        notifySuccess(`Academic Year ${form.yearName} created successfully!`);
      }
      setModalOpen(false);
      fetchYears();
    } catch (error) {
      notifyError(`Failed to save academic year: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (row) => {
    try {
      await academicYearService.update(row.id, { isCurrent: true });
      notifySuccess(`Set ${row.yearName} as the active Academic Year!`);
      fetchYears();
    } catch (error) {
      notifyError(`Failed to set active year: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await academicYearService.remove(deleteTarget.id);
      notifySuccess(`Academic Year ${deleteTarget.yearName} deleted.`);
      setDeleteTarget(null);
      fetchYears();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Academic Year', key: 'yearName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{val?.slice(0, 10)}</span> },
    { header: 'End Date', key: 'endDate', render: (val) => <span className="font-mono">{val?.slice(0, 10)}</span> },
    { header: 'Status', key: 'id', sortable: false, render: (_, row) => <StatusBadge status={deriveStatus(row)} /> },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.isCurrent && (
            <button
              onClick={() => handleSetActive(row)}
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100"
            >
              Set Active
            </button>
          )}
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filtered = years.filter((y) => y.yearName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Year Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage academic sessions, start/end dates, and set active session</p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search academic year..."
        addLabel="Add Academic Year"
        onAddClick={openAddModal}
        onRefreshClick={fetchYears}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Academic Years Found" description="Add your institution's first academic year to get started." actionLabel="Add Academic Year" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Academic Year' : 'Add Academic Year'}
        subtitle="Define the session start/end dates"
        icon={Calendar}
        submitLabel={editingId ? 'Save Changes' : 'Create Academic Year'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'yearName', label: 'Academic Year (e.g. 2026-2027)', required: true, span: 'full' },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          { name: 'isCurrent', label: 'Set as active academic year', type: 'checkbox', span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Academic Year"
        message={`Are you sure you want to delete "${deleteTarget?.yearName}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AcademicYearSetupPage;
