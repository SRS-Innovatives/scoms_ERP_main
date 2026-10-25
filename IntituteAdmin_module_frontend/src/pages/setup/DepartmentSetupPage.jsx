import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import departmentService from '../../services/departmentService';
import { Building2, Edit, Trash2 } from 'lucide-react';

const emptyForm = { code: '', name: '', description: '' };

export const DepartmentSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentService.getAll();
      setDepts(res.data || []);
    } catch (error) {
      notifyError(`Failed to load departments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchDepts();
  }, [fetchDepts]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({ code: row.code, name: row.name, description: row.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await departmentService.update(editingId, form);
        notifySuccess(`Department ${form.name} updated successfully!`);
      } else {
        await departmentService.create(form);
        notifySuccess(`Department ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchDepts();
    } catch (error) {
      notifyError(`Failed to save department: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentService.remove(deleteTarget.id);
      notifySuccess(`Department ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchDepts();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Dept Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Department Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Courses', key: '_count', sortable: false, render: (val) => `${val?.courses ?? 0} Courses` },
    { header: 'Staff Strength', key: '_countStaff', sortable: false, render: (_, row) => `${row._count?.staff ?? 0} Faculty` },
    { header: 'Student Count', key: '_countStudents', sortable: false, render: (_, row) => `${row._count?.students ?? 0} Enrolled` },
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

  const filtered = depts.filter(
    (d) => d.name?.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Academic & non-academic department master configuration</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search department name or code..."
        addLabel="Add Department"
        onAddClick={openAddModal}
        onRefreshClick={fetchDepts}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Departments Found" description="Add your institution's first department to get started." actionLabel="Add Department" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Department' : 'Add Department'}
        subtitle="Define department code, name and description"
        icon={Building2}
        submitLabel={editingId ? 'Save Changes' : 'Create Department'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'code', label: 'Department Code (e.g. CSE)', required: true },
          { name: 'name', label: 'Department Name', required: true },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DepartmentSetupPage;
