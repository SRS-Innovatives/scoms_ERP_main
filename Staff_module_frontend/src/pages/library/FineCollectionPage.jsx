import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import { CircleDollarSign, Loader2 } from 'lucide-react';
import libraryService from '../../services/libraryService';

export const FineCollectionPage = () => {
  const { success, error: showError } = useNotification();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    libraryService.getFines()
      .then((res) => setFines(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load fines', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCollect = async (id) => {
    setBusyId(id);
    try {
      await libraryService.collectFine(id);
      success('Fine collected successfully.', 'Collected');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to collect fine', 'Collect Failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <CircleDollarSign className="w-5 h-5 text-rose-500" /> Library Overdue Fine Collection
      </h3>
      <p className="text-xs text-slate-500 -mt-2">Returned books with an outstanding overdue fine (₹5/day)</p>

      {fines.length === 0 ? (
        <p className="text-xs text-slate-400">No outstanding fines.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Book Title</th>
                <th className="p-3">Returned On</th>
                <th className="p-3">Fine (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {fines.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{f.student?.firstName} {f.student?.lastName} ({f.student?.rollNumber})</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">{f.book?.title}</td>
                  <td className="p-3">{new Date(f.returnedAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-bold text-rose-600">₹{f.fineAmount}</td>
                  <td className="p-3"><StatusBadge status={f.finePaid ? 'PAID' : 'PENDING'} /></td>
                  <td className="p-3 text-right">
                    {!f.finePaid && (
                      <button onClick={() => handleCollect(f.id)} disabled={busyId === f.id} className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                        {busyId === f.id ? 'Collecting...' : 'Collect Fine'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FineCollectionPage;
