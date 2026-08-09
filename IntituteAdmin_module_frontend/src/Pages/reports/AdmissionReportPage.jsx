import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { studentsList } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';

export const AdmissionReportPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');

  const columns = [
    { header: 'Reg No', key: 'regNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Gender', key: 'gender' },
    { header: 'Course & Dept', key: 'course' },
    { header: 'Aadhaar No', key: 'aadhaarNo', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Caste Category', key: 'casteCommunity' },
    { header: 'Scholarship Scheme', key: 'scholarship' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admission & Intake Analytics Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Demographic report with Print, PDF download & Excel export</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button onClick={() => notifySuccess('PDF Export Started')} className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button onClick={() => notifySuccess('Excel Spreadsheet Downloaded!')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search report..." />
      <DataTable columns={columns} data={studentsList} />
    </div>
  );
};

export default AdmissionReportPage;
