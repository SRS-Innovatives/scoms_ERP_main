import React, { useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';

export const FileUpload = ({ label = 'Upload Document', accept = '.pdf,.png,.jpg,.jpeg', onFileSelect }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (onFileSelect) onFileSelect(selected);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        {file ? (
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
              <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-slate-400 hover:text-rose-500 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <UploadCloud className="w-7 h-7 text-indigo-500 mb-1" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Drag & drop or <span className="text-indigo-600 font-semibold underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
