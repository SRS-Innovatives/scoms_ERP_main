import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import circularService from '../../services/circularService';
import { FileText, Download, Pencil, Trash2 } from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone (staff, students, parents)' },
  { value: 'STAFF', label: 'Staff only' },
  { value: 'STUDENTS', label: 'Students only' },
  { value: 'PARENTS', label: 'Parents only' },
];
const AUDIENCE_LABEL = { ALL: 'Everyone', STAFF: 'Staff', STUDENTS: 'Students', PARENTS: 'Parents' };
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ refNo: '', title: '', issuedBy: '', issueDate: today(), audience: 'ALL', description: '', file: null });

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read the file'));
  reader.readAsDataURL(file);
});

const downloadCircular =async (fetchOne, row, notifyError) => {
  try {
    const res = await fetchOne(row.id);
    const a = document.createElement('a');
    a.href = res.data.attachment;
    a.download = res.data.attachmentName || `${row.refNo}.pdf`;
    a.click();
  } catch (err) {
    notifyError(`Download failed: ${err.message}`);
  }
};

/** Official circulars: reference number, signatory, audience and a signed PDF. */
export const CircularsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    circularService.getAll()
      .then((res) => setRows(res.data || []))
      .catch((err) => { notifyError(`Failed to load circulars: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ refNo: row.refNo, title: row.title, issuedBy: row.issuedBy, issueDate: String(row.issueDate).slice(0, 10), audience: row.audience, description: row.description || '', file: null });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { file, ...fields } = form;
    if (file && file.size > MAX_FILE_BYTES) { notifyError('The PDF must be under 5 MB'); return; }
    setSaving(true);
    try {
      const payload = { ...fields, ...(file && { attachment: await readAsDataUrl(file), attachmentName: file.name }) };
      if (editing) await circularService.update(editing.id, payload);
      else await circularService.create(payload);
      notifySuccess(editing ? 'Circular updated' : 'Circular published');
      setModalOpen(false);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await circularService.remove(toDelete.id);
      notifySuccess('Circular deleted');
      setToDelete(null);
      load();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => !q || [r.refNo, r.title, r.issuedBy].some((v) => String(v || '').toLowerCase().includes(q)));

  const columns = [
    { header: 'Ref No', key: 'refNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject / Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600 shrink-0" />{val}</span> },
    { header: 'Issue Date', key: 'issueDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> },
    { header: 'Issued By', key: 'issuedBy', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'Audience', key: 'audience', render: (val) => <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">{AUDIENCE_LABEL[val] || val}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-3 text-xs">
          {row.hasAttachment && (
            <button onClick={() => downloadCircular(circularService.getById, row, notifyError)} className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"><Download className="w-3.5 h-3.5" /> PDF</button>
          )}
          <button onClick={() => openEdit(row)} title="Edit" className="text-slate-500 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setToDelete(row)} title="Delete" className="text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const fields = [
    { name: 'refNo', label: 'Reference No', required: true, placeholder: 'CIR/2026/001' },
    { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { name: 'title', label: 'Subject / Title', required: true, span: 'full' },
    { name: 'issuedBy', label: 'Issued By (signatory)', required: true, placeholder: 'Principal' },
    { name: 'audience', label: 'Visible To', type: 'select', required: true, options: AUDIENCE_OPTIONS },
    { name: 'description', label: 'Summary (optional)', type: 'textarea', span: 'full' },
    {
      name: 'file', label: 'Signed PDF (optional)', type: 'file', span: 'full', accept: 'application/pdf,image/png,image/jpeg',
      hint: editing?.hasAttachment ? `Current: ${editing.attachmentName} — choose a file only to replace it. Max 5 MB.` : 'PDF, PNG or JPEG, max 5 MB',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Official Circulars</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Numbered, signed circulars — shown in the Staff, Student and Parent portals based on "Visible To"</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="New Circular" onAddClick={openNew} />
      {error ? <ErrorState onRetry={load} /> : <DataTable columns={columns} data={filtered} loading={loading} />}

      <FormModal
        isOpen={modalOpen}
        title={editing ? 'Edit Circular' : 'New Circular'}
        subtitle="Attach the signed PDF so recipients can download it"
        icon={FileText}
        fields={fields}
        values={form}
        onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
        submitLabel={editing ? 'Save Changes' : 'Publish'}
        isSubmitting={saving}
      />

      <ConfirmDialog
        isOpen={!!toDelete}
        title="Delete circular?"
        message={toDelete ? `${toDelete.refNo} — "${toDelete.title}" will be removed from every portal.` : ''}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default CircularsPage;
