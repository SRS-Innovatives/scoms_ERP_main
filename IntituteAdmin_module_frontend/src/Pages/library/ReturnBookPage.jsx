import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { RotateCcw, Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';

export const ReturnBookPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    libraryService.getActiveIssues()
      .then((res) => setIssues(res.data || []))
      .catch((err) => notifyError(`Failed to load active issues: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleReturn = async (issueId) => {
    setBusyId(issueId);
    try {
      const res = await libraryService.returnBook(issueId);
      notifySuccess(res.message, 'Book Returned');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to return book: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { header: 'Book', key: 'book', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.title}</span> },
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-semibold">{val?.firstName} {val?.lastName} ({val?.rollNumber})</span> },
    { header: 'Issued On', key: 'issuedAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    {
      header: 'Due Date', key: 'dueDate', render: (val) => {
        const overdue = new Date(val) < new Date();
        return <span className={`font-mono font-semibold ${overdue ? 'text-rose-600' : ''}`}>{new Date(val).toLocaleDateString('en-IN')}{overdue ? ' (Overdue)' : ''}</span>;
      },
    },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id) => (
        <button onClick={() => handleReturn(id)} disabled={busyId === id} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
          <RotateCcw className="w-3.5 h-3.5" /> {busyId === id ? 'Processing...' : 'Confirm Return'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Return & Renewal Desk</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Process returned books and auto-calculate overdue fines (₹5/day)</p>
      </div>

      {!loading && issues.length === 0 ? (
        <EmptyState title="No Books Currently Issued" description="Every book has been returned to the library." icon={RotateCcw} />
      ) : (
        <DataTable columns={columns} data={issues} loading={loading} />
      )}
    </div>
  );
};

export default ReturnBookPage;
