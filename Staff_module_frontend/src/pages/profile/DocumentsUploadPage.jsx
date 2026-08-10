import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import FileUpload from '../../components/common/FileUpload';
import StatusBadge from '../../components/common/StatusBadge';
import { FileText, Download } from 'lucide-react';

export const DocumentsUploadPage = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          Upload New Document
        </h3>
        <FileUpload label="Upload Identification / Qualification Document (PDF/JPG)" />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          Uploaded Document Vault
        </h3>
        <div className="space-y-3">
          {mockStaffProfile.documents.map((doc) => (
            <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-sky-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{doc.name}</h4>
                  <span className="text-[10px] text-slate-400">Uploaded: {doc.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={doc.status} size="sm" />
                <button className="p-1.5 text-slate-500 hover:text-sky-600">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentsUploadPage;
