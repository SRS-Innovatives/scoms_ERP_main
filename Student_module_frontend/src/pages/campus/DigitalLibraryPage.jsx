import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import campusService from '../../services/campusService';
import ErrorState from '../../components/common/ErrorState';

export const DigitalLibraryPage = () => {
  const { success, error: showError } = useNotification();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    campusService.getMyLibrary()
      .then((res) => setIssues(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load library records', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRenew = async (issueId, title) => {
    setBusyId(issueId);
    try {
      const res = await campusService.renewBook(issueId);
      success(res.message || `Renewed loan for ${title}`, 'Book Renewed');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to renew loan', 'Renewal Failed');
    } finally {
      setBusyId(null);
    }
  };

  const issued = issues.filter((i) => i.status === 'ISSUED');
  const returned = issues.filter((i) => i.status === 'RETURNED');

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Digital Library & Book Bank" subtitle="Books currently issued to you and your borrowing history." />

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Currently Issued Books</h3>
        {issued.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No books currently issued to you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {issued.map((bk) => {
              const overdue = new Date(bk.dueDate) < new Date();
              return (
                <div key={bk.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{bk.book?.title}</h4>
                    <StatusBadge status={overdue ? 'Inactive' : 'Active'} text={overdue ? 'OVERDUE' : 'ON LOAN'} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500">Author: {bk.book?.author}</p>
                  <p className={`text-xs font-semibold ${overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                    Return Due Date: {new Date(bk.dueDate).toLocaleDateString('en-IN')}
                  </p>

                  <button
                    onClick={() => handleRenew(bk.id, bk.book?.title)}
                    disabled={busyId === bk.id || overdue}
                    className="w-full py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {busyId === bk.id ? 'Renewing...' : overdue ? 'Return at Library Desk First' : 'Renew Book Loan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {returned.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> Borrowing History</h3>
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
                <tr><th className="p-3">Book</th><th className="p-3">Issued</th><th className="p-3">Returned</th><th className="p-3">Fine</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {returned.map((bk) => (
                  <tr key={bk.id}>
                    <td className="p-3 font-semibold">{bk.book?.title}</td>
                    <td className="p-3">{new Date(bk.issuedAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3">{new Date(bk.returnedAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3">{bk.fineAmount > 0 ? <span className={bk.finePaid ? 'text-emerald-600' : 'text-rose-600'}>₹{bk.fineAmount} {bk.finePaid ? '(Paid)' : '(Due)'}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalLibraryPage;
