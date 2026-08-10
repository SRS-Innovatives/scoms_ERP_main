import React from 'react';
import FileUpload from '../../components/common/FileUpload';
import { UploadCloud } from 'lucide-react';

export const ImportQuestionsPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-indigo-500" /> Bulk Import Questions (CSV / Excel / Word Template)
      </h3>
      <FileUpload label="Upload Excel (.xlsx) or CSV containing Question Bank structure" accept=".xlsx,.csv" />
    </div>
  );
};

export default ImportQuestionsPage;
