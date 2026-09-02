import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';

export const LibraryReportsPage = () => {
  const { notifyError } = useNotification();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryService.getReports()
      .then((res) => setReport(res.data))
      .catch((err) => notifyError(`Failed to load library report: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const columns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Author', key: 'author' },
    { header: 'Total Copies', key: 'totalCopies' },
    { header: 'Issued', key: 'totalCopies2', sortable: false, render: (_, row) => row.totalCopies - row.availableCopies },
    { header: 'Available', key: 'availableCopies' },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Stock & Circulation Audit Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Total books inventory, active circulation & overdue snapshot</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 rounded-xl">
          <p className="text-slate-500">Total Titles</p>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200">{report?.totalTitles ?? 0}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
          <p className="text-slate-500">Total Copies</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{report?.totalCopies ?? 0}</p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 rounded-xl">
          <p className="text-slate-500">Currently Issued</p>
          <p className="text-2xl font-black text-emerald-700">{report?.activeIssues ?? 0}</p>
        </div>
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 rounded-xl">
          <p className="text-slate-500">Overdue Books</p>
          <p className="text-2xl font-black text-rose-700">{report?.overdueCount ?? 0}</p>
        </div>
      </div>

      <DataTable columns={columns} data={report?.books || []} />
    </div>
  );
};

export default LibraryReportsPage;
