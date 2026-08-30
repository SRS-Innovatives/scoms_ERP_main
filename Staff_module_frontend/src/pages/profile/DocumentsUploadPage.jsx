import React from 'react';
import { FileText } from 'lucide-react';

export const DocumentsUploadPage = () => {
  return (
    <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl mx-auto space-y-2">
      <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
      <p>Document upload & storage is not yet available for staff profiles — this requires file-storage infrastructure that hasn't been enabled for your institution yet.</p>
    </div>
  );
};

export default DocumentsUploadPage;
