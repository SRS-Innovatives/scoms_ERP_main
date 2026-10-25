import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';

export const FineCollectionPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    libraryService.getFines()
      .then((res) => setFines(res.data || []))
      .catch((err) => { notifyError(`Failed to load fines: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCollect = async (id) => {
    setBusyId(id);
    try {
      await libraryService.collectFine(id);
      notifySuccess('Fine collected successfully.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to collect fine: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const daysOverdue = (row) => Math.max(0, Math.ceil((new Date(row.returnedAt) - new Date(row.dueDate)) / (1000 * 60 * 60 * 24)));

  const columns = [
    { header: 'Student Name', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Roll No', key: 'student2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.student?.rollNumber}</span> },
    { header: 'Book Title', key: 'book', sortable: false, render: (val) => val?.title },
    { header: 'Overdue Days', key: 'returnedAt', sortable: false, render: (_, row) => <span className="font-mono text-rose-600 font-bold">{daysOverdue(row)} Days</span> },
    { header: 'Fine Dues (₹)', key: 'fineAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val}</span> },
    { header: 'Status', key: 'finePaid', render: (val) => <StatusBadge status={val ? 'PAID' : 'PENDING'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => !row.finePaid && (
        <button onClick={() => handleCollect(id)} disabled={busyId === id} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
          {busyId === id ? 'Collecting...' : 'Collect Fine'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Overdue Fine Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Collect overdue book fines calculated at ₹5/day past the due date</p>
      </div>

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && fines.length === 0 ? (
        <EmptyState title="No Overdue Fines" description="No returned books currently have an outstanding fine." />
      ) : (
        <DataTable columns={columns} data={fines} loading={loading} />
      )}
    </div>
  );
};

export default FineCollectionPage;
