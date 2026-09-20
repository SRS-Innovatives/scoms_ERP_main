import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import textbookService from '../../services/textbookService';
import { BrainCircuit, Edit, Trash2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

const CLASS_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 5), label: `Class ${i + 5}` }));
const LANGUAGE_OPTIONS = [{ value: 'ENGLISH', label: 'English' }, { value: 'TAMIL', label: 'Tamil' }];

const emptyForm = { classGrade: '', subject: '', language: 'ENGLISH', chapterTitle: '', content: '' };

/** What the AI Study Tutor actually grounds its answers in — upload the real chapter text
 * once per class+subject+language and the student portal's AI Tutor references it live. */
export const AiTutorContentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    textbookService.getAll()
      .then((res) => setItems(res.data || []))
      .catch((err) => { notifyError(`Failed to load textbook content: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ classGrade: String(row.classGrade), subject: row.subject, language: row.language, chapterTitle: row.chapterTitle, content: row.content });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await textbookService.update(editingId, form);
        notifySuccess('Chapter updated successfully!');
      } else {
        await textbookService.create(form);
        notifySuccess('Chapter added — students can now ask the AI Tutor about it.');
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await textbookService.remove(deleteTarget.id);
      notifySuccess('Chapter deleted.');
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { header: 'Class', key: 'classGrade', render: (val) => <span className="font-mono font-bold text-indigo-600">Class {val}</span> },
    { header: 'Subject', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Language', key: 'language', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{val}</span> },
    { header: 'Chapter', key: 'chapterTitle' },
    { header: 'Length', key: 'content', sortable: false, render: (val) => `${val?.length.toLocaleString() || 0} chars` },
    { header: 'Uploaded By', key: 'uploadedBy', sortable: false, render: (val) => val ? `${val.firstName} ${val.lastName}` : '—' },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const filtered = items.filter((i) => i.subject?.toLowerCase().includes(search.toLowerCase()) || i.chapterTitle?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Study Tutor — Textbook Content</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload Std 5-12 chapter content (Tamil & English) — this is exactly what the AI Tutor grounds its answers in, per class/subject</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by subject or chapter..." addLabel="Add Chapter" onAddClick={openAdd} onRefreshClick={fetchAll} />

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState icon={BrainCircuit} title="No Textbook Content Yet" description="Add your first chapter so the AI Tutor has something real to answer from." actionLabel="Add Chapter" onAction={openAdd} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Chapter' : 'Add Textbook Chapter'}
        subtitle="The full chapter text — the AI Tutor will only answer using what's pasted here"
        icon={BrainCircuit}
        submitLabel={editingId ? 'Save Changes' : 'Add Chapter'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'classGrade', label: 'Class', type: 'select', required: true, options: CLASS_OPTIONS },
          { name: 'language', label: 'Language', type: 'select', required: true, options: LANGUAGE_OPTIONS },
          { name: 'subject', label: 'Subject', required: true, span: 'full', placeholder: 'e.g. Science, Tamil, Social Science' },
          { name: 'chapterTitle', label: 'Chapter Title', required: true, span: 'full', placeholder: 'e.g. Chapter 4: Photosynthesis' },
          { name: 'content', label: 'Chapter Content', type: 'textarea', required: true, span: 'full', rows: 12, placeholder: 'Paste the full chapter text here...' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${deleteTarget?.chapterTitle}"? The AI Tutor will no longer be able to answer from it.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AiTutorContentPage;
