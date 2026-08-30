import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import semesterService from '../../services/semesterService';
import courseService from '../../services/courseService';
import academicYearService from '../../services/academicYearService';
import { BookOpen, Edit, Trash2 } from 'lucide-react';

const emptyForm = { courseId: '', academicYearId: '', name: '', semesterNumber: '' };

export const SemesterSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
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
      const [semRes, courseRes, ayRes] = await Promise.all([
        semesterService.getAll(),
        courseService.getAll(),
        academicYearService.getAll(),
      ]);
      setSemesters(semRes.data || []);
      setCourses(courseRes.data || []);
      setAcademicYears(ayRes.data || []);
    } catch (error) {
      notifyError(`Failed to load semesters: ${error.message}`);
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
    setForm({ courseId: row.courseId, academicYearId: row.academicYearId, name: row.name, semesterNumber: row.semesterNumber });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await semesterService.update(editingId, { name: form.name, semesterNumber: form.semesterNumber, academicYearId: form.academicYearId });
        notifySuccess(`Semester ${form.name} updated successfully!`);
      } else {
        await semesterService.create(form);
        notifySuccess(`Semester ${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save semester: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await semesterService.remove(deleteTarget.id);
      notifySuccess(`Semester ${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Semester Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course', sortable: false, render: (val) => val?.name || '-' },
    { header: 'Academic Year', key: 'academicYear', sortable: false, render: (val) => val?.yearName || '-' },
    { header: 'Sections', key: '_count', sortable: false, render: (val) => `${val?.sections ?? 0} Sections` },
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

  const filtered = semesters.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Semester Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage term schedules for each course/academic year</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Semester" onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Semesters Found" description="Add a semester to get started. You'll need a course and academic year first." actionLabel="Add Semester" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Semester' : 'Add Semester'}
        subtitle="Link a semester to its course and academic year"
        icon={BookOpen}
        submitLabel={editingId ? 'Save Changes' : 'Create Semester'}
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
          {
            name: 'academicYearId',
            label: 'Academic Year',
            type: 'select',
            required: true,
            span: 'full',
            options: academicYears.map((y) => ({ value: y.id, label: y.yearName })),
          },
          { name: 'name', label: 'Semester Title (e.g. Semester 1)', required: true },
          { name: 'semesterNumber', label: 'Semester Number', type: 'number', required: true },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Semester"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SemesterSetupPage;
