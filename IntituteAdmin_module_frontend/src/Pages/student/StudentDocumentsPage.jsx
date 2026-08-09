import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import FormSection from '../../components/common/FormSection';
import DataTable from '../../components/common/DataTable';
import { useNotification } from '../../context/NotificationContext';
import { FileText, Eye, Download, ShieldCheck } from 'lucide-react';

export const StudentDocumentsPage = () => {
  const { notifySuccess } = useNotification();
  const docs = [
    { title: '10th SSLC Marksheet', type: 'Certificate', uploadDate: '2021-08-01', size: '1.2 MB', verified: true },
    { title: '12th HSC Marksheet', type: 'Certificate', uploadDate: '2021-08-01', size: '1.5 MB', verified: true },
    { title: 'Community Certificate (BC)', type: 'Government ID', uploadDate: '2021-08-02', size: '850 KB', verified: true },
    { title: 'Aadhaar Card Copy', type: 'Identity Proof', uploadDate: '2021-08-02', size: '640 KB', verified: true }
  ];

  const columns = [
    { header: 'Document Name', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Type', key: 'type' },
    { header: 'Upload Date', key: 'uploadDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'File Size', key: 'size', render: (val) => <span className="font-mono text-slate-500">{val}</span> },
    { header: 'Verification', key: 'verified', render: () => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Verified</span> },
    {
      header: 'Actions',
      key: 'title',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600"><Eye className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600"><Download className="w-3.5 h-3.5" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Document Vault</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Digital repository for SSLC, HSC, Community Certificate, Income Cert & Aadhaar copies</p>
      </div>

      <FormSection title="Upload Document for Student" subtitle="Supported formats: PDF, PNG, JPG">
        <FileUpload label="Select Document" onFileSelect={() => notifySuccess('Document uploaded!')} />
      </FormSection>

      <DataTable columns={columns} data={docs} />
    </div>
  );
};

export default StudentDocumentsPage;
