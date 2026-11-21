import React, { useEffect, useState, useCallback } from 'react';
import { FileText, FileImage, File as FileIcon, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ErrorState from '../../components/common/ErrorState';
import documentService from '../../services/documentService';

const TYPE_LABEL = {
  BIRTH_CERTIFICATE: 'Birth Certificate',
  TRANSFER_CERTIFICATE: 'Transfer Certificate',
  MARKSHEET: 'Marksheet',
  ID_PROOF: 'ID Proof',
  ADDRESS_PROOF: 'Address Proof',
  MEDICAL_RECORD: 'Medical Record',
  OTHER: 'Other',
};

/** The documents the institution keeps on my record — open / download only. */
export const MyDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentService.getMyDocuments();
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const types = [...new Set(documents.map((d) => d.documentType))];
  const shown = type === 'ALL' ? documents : documents.filter((d) => d.documentType === type);

  return (
    <div className="space-y-6">
      <PageHeader title="My Documents" subtitle="Documents your institution keeps on your record — open or download them any time." />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : documents.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <FolderOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p>No documents on your record yet. When the school office adds one (TC, marksheet, ID proof…), it will appear here.</p>
        </div>
      ) : (
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          {types.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {['ALL', ...types].map((t) => (
                <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  {t === 'ALL' ? `All (${documents.length})` : TYPE_LABEL[t] || t}
                </button>
              ))}
            </div>
          )}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {shown.map((d) => {
              const Icon = d.mimeType?.startsWith('image/') ? FileImage : d.mimeType === 'application/pdf' ? FileText : FileIcon;
              return (
                <li key={d.id} className="py-3 flex items-center gap-3">
                  <Icon className="w-8 h-8 text-indigo-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{d.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {TYPE_LABEL[d.documentType] || d.documentType}{d.fileName ? ` · ${d.fileName}` : ''} · added {new Date(d.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {d.fileUrl ? (
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold">
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] text-slate-400">File unavailable</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-[10px] text-slate-400">Something missing or wrong? Contact the school office — only they can add or change documents.</p>
        </div>
      )}
    </div>
  );
};

export default MyDocumentsPage;
