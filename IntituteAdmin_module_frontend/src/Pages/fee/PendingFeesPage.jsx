import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const PendingFeesPage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getPendingFees()
      .then((res) => setPending(res.data || []))
      .catch((err) => { notifyError(`Failed to load pending fees: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const filtered = pending.filter((p) => {
    const name = `${p.student?.firstName} ${p.student?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || p.student?.rollNumber?.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-rose-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Course', key: 'student3', sortable: false, render: (_, row) => row.student?.course?.name },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Due Date', key: 'feeStructure2', sortable: false, render: (_, row) => <span className="font-mono">{new Date(row.feeStructure?.dueDate).toLocaleDateString('en-IN')}</span> },
    { header: 'Pending Amount (₹)', key: 'dueAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: () => (
        <button onClick={() => navigate('/admin/fee/collect')} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Collect Fee
        </button>
      ),
    },
  ];

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pending Outstanding Fees Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Directory of students with overdue or partially paid fee assignments</p>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search defaulter name or roll no..." />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Pending Dues" description="Every student's fee assignment is fully paid." icon={CreditCard} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default PendingFeesPage;
