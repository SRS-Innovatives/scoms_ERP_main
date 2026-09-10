import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import gradeScaleService from '../../services/gradeScaleService';
import { Plus, Edit, Trash2, Sparkles, Loader2 } from 'lucide-react';

const emptyForm = { grade: '', minPercentage: '', maxPercentage: '', gradePoint: '', description: '' };

export const GradeSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [scale, setScale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchScale = useCallback(() => {
    setLoading(true);
    gradeScaleService.getAll()
      .then((res) => setScale(res.data || []))
      .catch((err) => notifyError(`Failed to load grade scale: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchScale(); }, [fetchScale]);

  const handleSeedDefault = async () => {
    setSeeding(true);
    try {
      await gradeScaleService.seedDefault();
      notifySuccess('Default grade scale created — edit any row to customize it.');
      fetchScale();
    } catch (err) {
      notifyError(`Failed to seed default scale: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({
      grade: row.grade,
      minPercentage: row.minPercentage,
      maxPercentage: row.maxPercentage,
      gradePoint: row.gradePoint,
      description: row.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await gradeScaleService.update(editingId, form);
        notifySuccess(`Grade "${form.grade}" updated successfully!`);
      } else {
        await gradeScaleService.create(form);
        notifySuccess(`Grade "${form.grade}" added successfully!`);
      }
      setModalOpen(false);
      fetchScale();
    } catch (err) {
      notifyError(`Failed to save grade: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await gradeScaleService.remove(deleteTarget.id);
      notifySuccess(`Grade "${deleteTarget.grade}" deleted.`);
      setDeleteTarget(null);
      fetchScale();
    } catch (err) {
      notifyError(`Failed to delete: ${err.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Letter Grade', key: 'grade', render: (val) => <span className="font-bold text-lg text-indigo-600 font-mono">{val}</span> },
    { header: 'Grade Point (10 Scale)', key: 'gradePoint', render: (val) => <span className="font-mono font-bold text-slate-900 dark:text-white">{val} Points</span> },
    { header: 'Percentage Range', key: 'minPercentage', sortable: false, render: (_, row) => <span className="font-mono">{row.minPercentage}% – {row.maxPercentage}%</span> },
    { header: 'Description', key: 'description', render: (val) => <span className="font-semibold text-slate-700 dark:text-slate-300">{val || '—'}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
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

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Grading System & CGPA Scale Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real, editable grade-point mapping — drives every letter grade and SGPA/CGPA shown on marksheets</p>
        </div>
        {scale.length > 0 && (
          <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
            <Plus className="w-4 h-4" /> Add Grade
          </button>
        )}
      </div>

      {scale.length === 0 ? (
        <EmptyState
          title="No Grade Scale Configured Yet"
          description="Without this, marks entry falls back to a sensible default curve (not editable). Set up your own scale, or start from a sensible default and customize it."
          icon={Sparkles}
          actionLabel={seeding ? 'Creating...' : 'Create Default Scale'}
          onAction={handleSeedDefault}
        />
      ) : (
        <DataTable columns={columns} data={scale} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Grade' : 'Add Grade'}
        submitLabel={editingId ? 'Save Changes' : 'Add Grade'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'grade', label: 'Letter Grade (e.g. A+)', required: true },
          { name: 'gradePoint', label: 'Grade Point (0-10)', type: 'number', required: true },
          { name: 'minPercentage', label: 'Min %', type: 'number', required: true },
          { name: 'maxPercentage', label: 'Max %', type: 'number', required: true },
          { name: 'description', label: 'Description', span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Grade"
        message={`Delete grade "${deleteTarget?.grade}"? Marks in this range will no longer be graded until you add a replacement.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default GradeSetupPage;
