import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import courseService from '../../services/courseService';
import departmentService from '../../services/departmentService';
import { GraduationCap, Edit, Trash2 } from 'lucide-react';

const emptyForm = { departmentId: '', code: '', name: '', durationYears: '' };

export const CourseClassSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [courses, setCourses] = useState([]);
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
      const [courseRes, deptRes] = await Promise.all([courseService.getAll(), departmentService.getAll()]);
      setCourses(courseRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (error) {
      notifyError(`Failed to load courses: ${error.message}`);
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
    setForm({ departmentId: row.departmentId, code: row.code, name: row.name, durationYears: row.durationYears });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await courseService.update(editingId, form);
        notifySuccess(`Course ${form.name} updated successfully!`);
      } else {
        await courseService.create(form);
        notifySuccess(`Course ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save course: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await courseService.remove(deleteTarget.id);
      notifySuccess(`Course ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Course Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Course Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '-' },
    { header: 'Duration', key: 'durationYears', render: (val) => `${val} Year${val === 1 ? '' : 's'}` },
    { header: 'Students', key: '_count', sortable: false, render: (val) => `${val?.students ?? 0} Enrolled` },
    { header: 'Subjects', key: '_countSub', sortable: false, render: (_, row) => `${row._count?.subjects ?? 0} Subjects` },
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

  const filtered = courses.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Course & Class Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure UG/PG degree programs, classes and duration</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search courses..."
        addLabel="Add New Course"
        onAddClick={openAddModal}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Courses Found" description="Add a course/degree program to get started. You'll need a department first." actionLabel="Add New Course" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Course' : 'Add Course'}
        subtitle="Define course code, name, department and duration"
        icon={GraduationCap}
        submitLabel={editingId ? 'Save Changes' : 'Create Course'}
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
          { name: 'code', label: 'Course Code (e.g. BTECH-CSE)', required: true },
          { name: 'name', label: 'Course Name', required: true },
          { name: 'durationYears', label: 'Duration (Years)', type: 'number', required: true },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CourseClassSetupPage;
