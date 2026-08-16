import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockLibraryBooks } from '../../data/mockStudentData';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const DigitalLibraryPage = () => {
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader title="Digital Library & Book Bank" subtitle="Manage physical book issues, renewals, and digital e-book repository." />

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Currently Issued Books</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockLibraryBooks.map((bk) => (
            <div key={bk.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{bk.title}</h4>
                <StatusBadge status={bk.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500">Author: {bk.author}</p>
              <p className="text-xs font-semibold text-rose-600">Return Due Date: {bk.dueDate}</p>

              <button
                onClick={() => success(`Renewed loan for ${bk.title} by 14 days`, 'Book Renewed')}
                className="w-full py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Renew Book Loan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalLibraryPage;
