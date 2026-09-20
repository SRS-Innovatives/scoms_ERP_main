import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from '../../components/common/FileUpload';
import FormSection from '../../components/common/FormSection';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { FileText, Trash2, ShieldCheck } from 'lucide-react';
import studentService from '../../services/studentService';
import studentDocumentService from '../../services/studentDocumentService';

const DOCUMENT_TYPES = [
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate' },
  { value: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate' },
  { value: 'MARKSHEET', label: 'Marksheet' },
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'MEDICAL_RECORD', label: 'Medical Record' },
  { value: 'OTHER', label: 'Other' },
];

const fileToDataUri = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const StudentDocumentsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    studentService.getAll({ limit: 200 })
      .then((res) => setStudents(res.data?.data || res.data || []))
      .catch((err) => notifyError(`Failed to load students: ${err.message}`));
  }, [notifyError]);

  const fetchDocuments = useCallback(() => {
    if (!selectedStudentId) { setDocuments([]); return; }
    setLoading(true);
    studentDocumentService.getForStudent(selectedStudentId)
      .then((res) => setDocuments(res.data || []))
      .catch((err) => notifyError(`Failed to load documents: ${err.message}`))
      .finally(() => setLoading(false));
  }, [selectedStudentId, notifyError]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!selectedStudentId) { notifyError('Select a student first'); return; }
    if (!pendingFile || !title.trim()) { notifyError('Title and a file are required'); return; }
    setUploading(true);
    try {
      const fileData = await fileToDataUri(pendingFile);
      await studentDocumentService.upload(selectedStudentId, {
        documentType, title: title.trim(), fileData, fileName: pendingFile.name, mimeType: pendingFile.type,
      });
      notifySuccess('Document uploaded successfully!');
      setPendingFile(null);
      setTitle('');
      setDocumentType('OTHER');
      fetchDocuments();
    } catch (err) {
      notifyError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await studentDocumentService.remove(id);
      notifySuccess('Document deleted');
      fetchDocuments();
    } catch (err) {
      notifyError(`Delete failed: ${err.message}`);
    }
  };

  const columns = [
    { header: 'Document Name', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Type', key: 'documentType', render: (val) => DOCUMENT_TYPES.find((t) => t.value === val)?.label || val },
    { header: 'Uploaded', key: 'uploadedAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    { header: 'File', key: 'fileName', render: (val) => val || '—' },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => handleDelete(id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Document Vault</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Real documents attached to a student's record — birth certificate, TC, marksheets, ID proof</p>
      </div>

      <FormSection title="Select Student" subtitle="Choose a student to view or add documents to their record">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full max-w-md p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
        >
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
          ))}
        </select>
      </FormSection>

      {selectedStudentId && (
        <>
          <FormSection title="Upload Document" subtitle="Supported formats: PDF, PNG, JPG (max 8MB)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Document Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Birth Certificate"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                >
                  {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <FileUpload label="Select Document" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={setPendingFile} />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </FormSection>

          {!loading && documents.length === 0 ? (
            <EmptyState title="No Documents Yet" description="Upload the first document for this student." icon={ShieldCheck} />
          ) : (
            <DataTable columns={columns} data={documents} loading={loading} />
          )}
        </>
      )}
    </div>
  );
};

export default StudentDocumentsPage;
