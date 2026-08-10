import React, { useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

export const FileUpload = ({ label = 'Upload Document', accept = '.pdf,.png,.jpg,.jpeg', onFileSelect }) => {
  const [file, setFile] = useState(null);

  const handleFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (onFileSelect) onFileSelect(f);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl cursor-pointer transition-all">
          <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag & drop</span>
          <span className="text-[11px] text-slate-400 mt-1">Formats: {accept} (Max: 10MB)</span>
          <input type="file" accept={accept} onChange={handleFile} className="hidden" />
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden">
            <File className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={() => setFile(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
