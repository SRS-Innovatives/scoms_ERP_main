import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import subjectService from '../../services/subjectService';
import courseService from '../../services/courseService';
import { Book, Edit, Trash2, Upload, LayoutGrid, X, AlertTriangle, Check } from 'lucide-react';

const emptyForm = { code: '', name: '', type: 'THEORY', credits: '' };

/** Multi-select checklist of every class this institution has — used both to map a
 * single subject and (implicitly) as the model for a future bulk matrix view. */
const ClassMappingModal = ({ subject, courses, onClose, onSave, submitting }) => {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (subject) setSelected((subject.classMappings || []).map((m) => m.course?.id || m.courseId));
  }, [subject]);

  if (!subject) return null;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"><LayoutGrid className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Map "{subject.name}" to Classes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select every class that teaches this subject</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        {courses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No classes set up yet — add classes under Institution Setup first.</p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
            {courses.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs">
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 rounded text-indigo-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">{selected.length} class(es) selected</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
            <button onClick={() => onSave(selected)} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> {submitting ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [mappingSubject, setMappingSubject] = useState(null);
  const [mappingSubmitting, setMappingSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

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
    setForm({ code: row.code, name: row.name, type: row.type, credits: row.credits });
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
        notifySuccess(`Subject ${form.name} created — it won't appear on any class until you map it to one.`);
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

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await subjectService.bulkUpload(file);
      setUploadResult(res.data);
      notifySuccess(res.message);
      fetchAll();
    } catch (error) {
      notifyError(`Upload failed: ${error.message}`);
    }
  };

  const handleSaveMapping = async (courseIds) => {
    setMappingSubmitting(true);
    try {
      const res = await subjectService.setClassMapping(mappingSubject.id, courseIds);
      notifySuccess(res.message);
      setMappingSubject(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save mapping: ${error.message}`);
    } finally {
      setMappingSubmitting(false);
    }
  };

  const columns = [
    { header: 'Subject Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    {
      header: 'Mapped Classes', key: 'classMappings', sortable: false,
      render: (val) => val?.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {val.map((m) => <span key={m.course?.id} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">{m.course?.name}</span>)}
        </div>
      ) : <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Not mapped to any class</span>,
    },
    { header: 'Type', key: 'type', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{val}</span> },
    { header: 'Credits', key: 'credits', render: (val) => <span className="font-bold font-mono">{val} Credits</span> },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setMappingSubject(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950" title="Map to Classes">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950" title="Edit">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950" title="Delete">
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create your subjects once, institution-wide, then map each one to whichever classes teach it
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUploadFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs"
            title="Upload Code / Name / Type / Credits columns — no class column, map them afterward"
          >
            <Upload className="w-4 h-4" /> Upload Subjects
          </button>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search subjects..." addLabel="Add Subject" onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {uploadResult && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Upload result: {uploadResult.created.length} of {uploadResult.totalRows} subject(s) created
            </p>
            <button onClick={() => setUploadResult(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          {uploadResult.failures.length > 0 && (
            <div className="text-rose-600 dark:text-rose-400">
              <p className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> {uploadResult.failures.length} row(s) failed:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {uploadResult.failures.map((f, i) => <li key={i}>Row {f.rowNumber}{f.code ? ` (${f.code})` : ''}: {f.reason}</li>)}
              </ul>
            </div>
          )}
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Now use the class icon on each new subject below to map it to the classes that teach it.</p>
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Subjects Found" description="Add a subject, or upload several at once, then map them to the classes that teach them." actionLabel="Add Subject" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Subject' : 'Add Subject'}
        subtitle={editingId ? undefined : 'Class mapping is a separate step — use the class icon after creating it'}
        icon={Book}
        submitLabel={editingId ? 'Save Changes' : 'Create Subject'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
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

      <ClassMappingModal subject={mappingSubject} courses={courses} onClose={() => setMappingSubject(null)} onSave={handleSaveMapping} submitting={mappingSubmitting} />

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
