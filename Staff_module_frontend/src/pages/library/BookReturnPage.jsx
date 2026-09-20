import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen, Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';
import ErrorState from '../../components/common/ErrorState';

export const BookReturnPage = () => {
  const { success, error: showError } = useNotification();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    libraryService.getActiveIssues()
      .then((res) => setIssues(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load active issues', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleReturn = async (issueId, bookTitle) => {
    setBusyId(issueId);
    try {
      const res = await libraryService.returnBook(issueId);
      success(res.message || `Book "${bookTitle}" checked in successfully!`, 'Return Processed');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to process return', 'Return Failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-500" /> Book Return & Check-In Desk
      </h3>

      {issues.length === 0 ? (
        <p className="text-xs text-slate-400">No books currently issued.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Book Title</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {issues.map((b) => {
                const overdue = new Date(b.dueDate) < new Date();
                return (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold">{b.student?.firstName} {b.student?.lastName} ({b.student?.rollNumber})</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{b.book?.title}</td>
                    <td className="p-3">{new Date(b.issuedAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-semibold">
                      {overdue ? <StatusBadge status="Inactive" text="OVERDUE" /> : new Date(b.dueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleReturn(b.id, b.book?.title)}
                        disabled={busyId === b.id}
                        className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === b.id ? 'Processing...' : 'Receive Return'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookReturnPage;
