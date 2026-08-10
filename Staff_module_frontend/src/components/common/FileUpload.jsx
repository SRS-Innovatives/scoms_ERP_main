import React, { useState } from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';

export const FileUpload = ({ label = 'Upload File', accept = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.png', onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      {!selectedFile ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl cursor-pointer transition-all">
          <UploadCloud className="w-8 h-8 text-sky-500 mb-2" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag & drop</span>
          <span className="text-[11px] text-slate-400 mt-1">Formats: {accept} (Max: 25MB)</span>
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 bg-sky-50/70 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden">
            <File className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={removeFile} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
