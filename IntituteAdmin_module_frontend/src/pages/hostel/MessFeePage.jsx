import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import hostelService from '../../services/hostelService';

export const MessFeePage = () => {
  const { notifyError } = useNotification();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    hostelService.getMessFees()
      .then((res) => setBeds(res.data || []))
      .catch((err) => { notifyError(`Failed to load mess fee list: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.rollNumber}</span> },
    { header: 'Hosteler Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Hostel Block', key: 'hostel', sortable: false, render: (val) => val?.name },
    { header: 'Mess Type', key: 'hostel2', sortable: false, render: (_, row) => row.hostel?.messType || '—' },
    { header: 'Monthly Bed + Mess Bill (₹)', key: 'monthlyFee', render: (val) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{val.toLocaleString()}</span> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Mess & Boarding Bill</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Monthly bed + mess dining bill per resident hosteler — configured via the bed's monthly fee</p>
      </div>

      {beds.length === 0 ? (
        <EmptyState title="No Resident Hostellers" description="Allocate beds to students under Room Allocation to see mess bills." icon={UtensilsCrossed} />
      ) : (
        <DataTable columns={columns} data={beds} />
      )}
    </div>
  );
};

export default MessFeePage;
