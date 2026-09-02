import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { FileText, ExternalLink, Loader2, FolderLock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import certificateService from '../../services/certificateService';

const TYPE_LABELS = {
  BONAFIDE: 'Bonafide Certificate',
  TC: 'Transfer Certificate',
  CONDUCT: 'Conduct Certificate',
  COMPLETION: 'Course Completion Certificate',
  FEEPAID: 'Fee Paid Certificate',
};

export const DocumentVaultPage = () => {
  const { error: showError } = useNotification();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateService.getMyCertificates()
      .then((res) => setCertificates(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load documents', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student Document Vault" subtitle="Certificates and official documents issued to you by the institution." />

      {certificates.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <FolderLock className="w-8 h-8 text-slate-300" />
          No certificates have been issued to you yet. Request one from the Certificates section, or ask your Institute Admin.
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((c) => (
            <div key={c.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{c.title || TYPE_LABELS[c.type] || c.type}</h4>
                  <p className="text-[10px] text-slate-400">{TYPE_LABELS[c.type] || c.type} • Cert. No. {c.certificateNo} • Issued {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {c.pdfUrl ? (
                <a
                  href={c.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
              ) : (
                <span className="text-slate-400 shrink-0">No file attached</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentVaultPage;
