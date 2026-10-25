import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import programService from '../../services/programService';
import departmentService from '../../services/departmentService';
import { Layers, Edit, Trash2 } from 'lucide-react';

const emptyForm = { departmentId: '', code: '', name: '', level: 'UG', durationYears: '' };
const LEVELS = ['UG', 'PG', 'DIPLOMA', 'PHD', 'CERTIFICATE', 'OTHER'];

export const ProgramSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const { institution } = useInstitution();
  const isSchool = institution?.type === 'SCHOOL';
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      const [programRes, deptRes] = await Promise.all([programService.getAll(), departmentService.getAll()]);
      setPrograms(programRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (error) {
      notifyError(`Failed to load programs: ${error.message}`);
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
    setForm({ departmentId: row.departmentId, code: row.code, name: row.name, level: row.level, durationYears: row.durationYears });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await programService.update(editingId, form);
        notifySuccess(`Program ${form.name} updated successfully!`);
      } else {
        await programService.create(form);
        notifySuccess(`Program ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save program: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await programService.remove(deleteTarget.id);
      notifySuccess(`Program ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Program Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Program Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Level', key: 'level' },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '-' },
    { header: 'Duration', key: 'durationYears', render: (val) => `${val} Year${val === 1 ? '' : 's'}` },
    { header: 'Courses', key: '_count', sortable: false, render: (val) => `${val?.courses ?? 0} Courses` },
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
  const filtered = programs.filter((p) => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));

  if (isSchool) {
    return (
      <EmptyState
        title="Programs are for colleges"
        description="Schools organise classes directly under departments. Use Course / Class Setup instead."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Program Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Group courses under degree programs (e.g. B.Tech over B.Tech CSE, B.Tech ECE)</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search programs..." addLabel="Add Program" onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Programs Found" description="Programs are optional. Add one to group related courses. You'll need a department first." actionLabel="Add Program" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Program' : 'Add Program'}
        subtitle="Define program code, name, level and department"
        icon={Layers}
        submitLabel={editingId ? 'Save Changes' : 'Create Program'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          {
            name: 'departmentId',
            label: 'Department',
            type: 'select',
            required: true,
            span: 'full',
            options: departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
          },
          { name: 'code', label: 'Program Code (e.g. BTECH)', required: true },
          { name: 'name', label: 'Program Name', required: true },
          { name: 'level', label: 'Level', type: 'select', options: LEVELS.map((l) => ({ value: l, label: l })) },
          { name: 'durationYears', label: 'Duration (Years)', type: 'number' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Program"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ProgramSetupPage;
