import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Upload, Loader2, Trash2, ExternalLink, FileImage, File as FileIcon } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

// Same list and limits as Staff_backend/src/controllers/staffDocumentController.js
const DOCUMENT_TYPES = [
  { value: 'ID_PROOF', label: 'ID Proof (Aadhaar, PAN, Passport)' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'EDUCATION', label: 'Education Certificate' },
  { value: 'EXPERIENCE', label: 'Experience / Relieving Letter' },
  { value: 'BANK', label: 'Bank Proof (Passbook / Cheque)' },
  { value: 'PHOTO', label: 'Photograph' },
  { value: 'OTHER', label: 'Other' },
];
const TYPE_LABEL = Object.fromEntries(DOCUMENT_TYPES.map((t) => [t.value, t.label.replace(/ \(.*\)$/, '')]));
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read the file'));
  reader.readAsDataURL(file);
});

const inputCls = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500';

export const DocumentsUploadPage = () => {
  const { success, error: showError } = useNotification();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ documentType: 'ID_PROOF', title: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await profileService.getMyDocuments();
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_BYTES) {
      showError('File is too large — please use a document under 5 MB');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
    if (f && !form.title.trim()) setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') }));
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) { showError('Choose a file to upload'); return; }
    if (!form.title.trim()) { showError('Give the document a title'); return; }
    setUploading(true);
    try {
      const fileData = await readAsDataUrl(file);
      const res = await profileService.uploadDocument({ ...form, title: form.title.trim(), fileData, fileName: file.name });
      setDocuments((p) => [res.data, ...p]);
      success('Document uploaded');
      setForm({ documentType: form.documentType, title: '' });
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      showError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await profileService.deleteDocument(id);
      setDocuments((p) => p.filter((d) => d.id !== id));
      success('Document deleted');
    } catch (err) {
      showError(err.message || 'Could not delete the document');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" /> My Documents
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Keep your ID proof, certificates and letters here. Only you can see and manage this list.</p>
      </div>

      <form onSubmit={upload} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload a document</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Document type</span>
            <select value={form.documentType} onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))} className={inputCls}>
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Title</span>
            <input value={form.title} maxLength={150} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Aadhaar card" className={inputCls} />
          </label>
        </div>
        <label className="space-y-1 block">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">File (PDF, image or Word — up to 5 MB)</span>
          <input ref={fileInput} type="file" accept={ACCEPT} onChange={pickFile} className={`${inputCls} file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-sky-600 file:text-white file:text-xs file:font-semibold`} />
        </label>
        <div className="flex justify-end">
          <button type="submit" disabled={uploading || !file} className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Uploaded documents {documents.length > 0 && <span className="text-slate-400 font-medium">({documents.length})</span>}</h3>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={load} />
        ) : documents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No documents yet — upload your first one above.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((d) => {
              const Icon = d.mimeType?.startsWith('image/') ? FileImage : d.mimeType === 'application/pdf' ? FileText : FileIcon;
              return (
                <li key={d.id} className="py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <Icon className="w-8 h-8 text-sky-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{d.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {TYPE_LABEL[d.documentType] || d.documentType}
                      {d.fileName ? ` · ${d.fileName}` : ''}
                      {d.fileSize ? ` · ${formatSize(d.fileSize)}` : ''}
                      {` · ${new Date(d.uploadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold">
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </a>
                    )}
                    {confirmId === d.id ? (
                      <>
                        <button onClick={() => remove(d.id)} disabled={deletingId === d.id} className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold disabled:opacity-50">
                          {deletingId === d.id ? 'Deleting...' : 'Delete'}
                        </button>
                        <button onClick={() => setConfirmId(null)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmId(d.id)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentsUploadPage;
