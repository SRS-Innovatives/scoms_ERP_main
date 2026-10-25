import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import sectionService from '../../services/sectionService';
import semesterService from '../../services/semesterService';
import { Users, Edit, Trash2 } from 'lucide-react';

const emptyForm = { semesterId: '', name: '', capacity: '' };

export const SectionSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
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
      const [secRes, semRes] = await Promise.all([sectionService.getAll(), semesterService.getAll()]);
      setSections(secRes.data || []);
      setSemesters(semRes.data || []);
    } catch (error) {
      notifyError(`Failed to load sections: ${error.message}`);
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
    setForm({ semesterId: row.semesterId, name: row.name, capacity: row.capacity });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await sectionService.update(editingId, { name: form.name, capacity: form.capacity });
        notifySuccess(`Section ${form.name} updated successfully!`);
      } else {
        await sectionService.create(form);
        notifySuccess(`Section ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save section: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await sectionService.remove(deleteTarget.id);
      notifySuccess(`Section ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Section Name', key: 'name', render: (val) => <span className="font-bold text-indigo-600">{val}</span> },
    {
      header: 'Semester / Course',
      key: 'semester',
      sortable: false,
      render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{val ? `${val.name} — ${val.course?.name || ''}` : '-'}</span>,
    },
    { header: 'Student Capacity', key: 'capacity', render: (val) => `${val} Students` },
    { header: 'Enrolled', key: '_count', sortable: false, render: (val) => `${val?.students ?? 0} Enrolled` },
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

  const filtered = sections.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Section Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage class sections (A, B, C) and their capacity per semester</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Section" onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Sections Found" description="Add a section to get started. You'll need a semester first." actionLabel="Add Section" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Section' : 'Add Section'}
        subtitle="Link a section to its semester and set capacity"
        icon={Users}
        submitLabel={editingId ? 'Save Changes' : 'Create Section'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          {
            name: 'semesterId',
            label: 'Semester',
            type: 'select',
            required: true,
            span: 'full',
            disabled: !!editingId,
            options: semesters.map((s) => ({ value: s.id, label: `${s.name} — ${s.course?.name || ''}` })),
          },
          { name: 'name', label: 'Section Name (e.g. Section A)', required: true },
          { name: 'capacity', label: 'Capacity', type: 'number', required: true },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SectionSetupPage;
