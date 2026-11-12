import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import batchService from '../../services/batchService';
import courseService from '../../services/courseService';
import { Users, Edit, Trash2 } from 'lucide-react';

const emptyForm = { courseId: '', name: '', startYear: '', endYear: '', status: 'ACTIVE' };
const STATUS_LABELS = { ACTIVE: 'Active', GRADUATED: 'Graduated', ARCHIVED: 'Archived' };

export const BatchSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const academic = useAcademic();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, courseRes] = await Promise.all([batchService.getAll(), courseService.getAll()]);
      setBatches(batchRes.data || []);
      setCourses(courseRes.data || []);
    } catch (error) {
      notifyError(`Failed to load batches: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({ courseId: row.courseId, name: row.name, startYear: row.startYear, endYear: row.endYear, status: row.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const { courseId, ...rest } = form;
        await batchService.update(editingId, rest);
        notifySuccess(`${academic.label('batch')} ${form.name} updated successfully!`);
      } else {
        await batchService.create(form);
        notifySuccess(`${academic.label('batch')} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save batch: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await batchService.remove(deleteTarget.id);
      notifySuccess(`${academic.label('batch')} ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: `${academic.label('batch')} Name`, key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: academic.label('course'), key: 'course', sortable: false, render: (val) => val?.name || '-' },
    { header: 'Passout Year', key: 'endYear', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Current Term', key: 'semesters', sortable: false, render: (val) => val?.[0]?.name || '-' },
    { header: 'Total Students', key: '_count', sortable: false, render: (val) => `${val?.students ?? 0} Enrolled` },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={STATUS_LABELS[val] || val} /> },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
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

  const q = search.toLowerCase();
  const filtered = batches.filter((b) => b.name?.toLowerCase().includes(q) || b.course?.name?.toLowerCase().includes(q));

  // Direct URL to a level this institution's structure doesn't use (hidden from the menu)
  if (!academic.isLevelEnabled('batch')) {
    return (
      <EmptyState
        title={`${academic.label('batch')}es are not used by this institution`}
        description={`Students are tracked by ${academic.label('academicYear').toLowerCase()} and ${academic.label('course').toLowerCase()} instead. Your platform administrator can enable this level if needed.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{academic.label('batch')} Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage 4-year / 3-year student admission cohort batches</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search..." addLabel={`Create ${academic.label('batch')}`} onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="Nothing Added Yet" description={`Create a ${academic.label('batch').toLowerCase()} for each ${academic.label('course').toLowerCase()} intake year. You'll need a ${academic.label('course').toLowerCase()} first.`} actionLabel={`Create ${academic.label('batch')}`} onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Batch' : 'Create Batch'}
        subtitle="Define the course, intake year and passout year"
        icon={Users}
        submitLabel={editingId ? 'Save Changes' : 'Create Batch'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          {
            name: 'courseId',
            label: academic.label('course'),
            type: 'select',
            required: true,
            span: 'full',
            disabled: !!editingId,
            options: courses.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
          },
          { name: 'startYear', label: 'Intake Year (e.g. 2024)', type: 'number', required: true },
          { name: 'endYear', label: 'Passout Year (e.g. 2028)', type: 'number', required: true },
          { name: 'name', label: `${academic.label('batch')} Name (optional, defaults to "2024 - 2028")`, span: 'full' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${academic.label('batch')}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default BatchSetupPage;
