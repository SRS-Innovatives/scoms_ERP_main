import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import FileUpload from '../../components/common/FileUpload';
import { FileText, Download } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const DocumentVaultPage = () => {
  const { success } = useNotification();

  const docs = [
    { name: "10th SSLC Marksheet Certificate.pdf", size: "1.2 MB", category: "Academic" },
    { name: "12th HSC Marksheet Certificate.pdf", size: "1.5 MB", category: "Academic" },
    { name: "Aadhaar Card Government ID.pdf", size: "850 KB", category: "Identity" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Student Document Vault" subtitle="Encrypted cloud storage for verified certificates, marksheets, and identity proofs." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
        <FileUpload label="Upload New Document PDF" />
      </div>

      <div className="space-y-3">
        {docs.map((d, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{d.name}</h4>
                <p className="text-[10px] text-slate-400">{d.category} • {d.size}</p>
              </div>
            </div>
            <button
              onClick={() => success(`Downloading ${d.name}`, 'Downloaded')}
              className="px-3 py-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentVaultPage;
