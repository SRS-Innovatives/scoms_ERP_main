import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import subjectService from '../../services/subjectService';
import courseService from '../../services/courseService';
import { Book, Edit, Trash2 } from 'lucide-react';

const emptyForm = { courseId: '', code: '', name: '', type: 'THEORY', credits: '' };

export const SubjectSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [subjects, setSubjects] = useState([]);
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
      const [subRes, courseRes] = await Promise.all([subjectService.getAll(), courseService.getAll()]);
      setSubjects(subRes.data || []);
      setCourses(courseRes.data || []);
    } catch (error) {
      notifyError(`Failed to load subjects: ${error.message}`);
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
    setForm({ courseId: row.courseId, code: row.code, name: row.name, type: row.type, credits: row.credits });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await subjectService.update(editingId, { code: form.code, name: form.name, type: form.type, credits: form.credits });
        notifySuccess(`Subject ${form.name} updated successfully!`);
      } else {
        await subjectService.create(form);
        notifySuccess(`Subject ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save subject: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subjectService.remove(deleteTarget.id);
      notifySuccess(`Subject ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Subject Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course', sortable: false, render: (val) => val?.name || '-' },
    { header: 'Type', key: 'type', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{val}</span> },
    { header: 'Credits', key: 'credits', render: (val) => <span className="font-bold font-mono">{val} Credits</span> },
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

  const filtered = subjects.filter(
    (s) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure Theory, Practical, and Elective subjects with credits</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search subjects..." addLabel="Add Subject" onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Subjects Found" description="Add a subject to get started. You'll need a course first." actionLabel="Add Subject" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Subject' : 'Add Subject'}
        subtitle="Link a subject to its course and define credits"
        icon={Book}
        submitLabel={editingId ? 'Save Changes' : 'Create Subject'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          {
            name: 'courseId',
            label: 'Course',
            type: 'select',
            required: true,
            span: 'full',
            disabled: !!editingId,
            options: courses.map((c) => ({ value: c.id, label: c.name })),
          },
          { name: 'code', label: 'Subject Code', required: true },
          { name: 'name', label: 'Subject Title', required: true },
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            required: true,
            options: [
              { value: 'THEORY', label: 'Theory' },
              { value: 'PRACTICAL', label: 'Practical / Lab' },
              { value: 'LAB', label: 'Lab' },
            ],
          },
          { name: 'credits', label: 'Credits', type: 'number', required: true },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SubjectSetupPage;
