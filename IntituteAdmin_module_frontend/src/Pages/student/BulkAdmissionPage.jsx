import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { UploadCloud, Download, CheckCircle, FileSpreadsheet } from 'lucide-react';

export const BulkAdmissionPage = () => {
  const { notifySuccess } = useNotification();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      notifySuccess(`Bulk student admission batch imported successfully! 120 student records uploaded.`, 'Import Complete');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Admission Upload (Excel / CSV)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Import student batches in bulk using standard Excel (.xlsx) template format</p>
      </div>

      <FormSection title="Download Excel Template" subtitle="Required column schema for batch import" icon={FileSpreadsheet}>
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
          <div>
            <p className="font-bold text-indigo-900 dark:text-indigo-200">SCOMS_Bulk_Student_Admission_Template.xlsx</p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Includes fields for Aadhaar, Caste, Scholarship, Parent info, Address & Course Code</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Sample Excel</span>
          </button>
        </div>
      </FormSection>

      <FormSection title="Upload Prepared Batch File" subtitle="Select your completed CSV or XLSX spreadsheet" icon={UploadCloud}>
        <div className="space-y-4">
          <FileUpload label="Select Excel File (.xlsx, .csv)" accept=".xlsx,.xls,.csv" onFileSelect={setSelectedFile} />
          {selectedFile && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Validating & Importing...' : 'Import Students Batch'}</span>
              </button>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
};

export default BulkAdmissionPage;
