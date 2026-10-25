import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import feeService from '../../services/feeService';

export const FeeStructurePage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const structRes = await feeService.getStructures();
      setStructures(structRes.data || []);
    } catch (error) {
      notifyError(`Failed to load fee structures: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (id) => {
    try {
      await feeService.deleteStructure(id);
      notifySuccess('Fee structure removed.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to remove fee structure: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Structure Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course', sortable: false, render: (val) => val?.name || 'All Courses' },
    { header: 'Fee Category', key: 'category', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{val?.replace('_', ' ')}</span> },
    { header: 'Academic Year', key: 'academicYear', sortable: false, render: (val) => val?.yearName },
    { header: 'Assignments', key: '_count', sortable: false, render: (val) => `${val?.assignments ?? 0} students` },
    { header: 'Amount (₹)', key: 'totalAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono text-rose-600 font-semibold">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Late Fine / Day', key: 'lateFeePerDay', render: (val) => <span className="font-mono">₹{val}/day</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const filtered = structures.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Structure (Legacy)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Existing single-amount fee structures — view and manage only</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          This legacy fee system no longer accepts new structures — two fee systems running side by side risked double-billing students.
          Existing structures below remain viewable and their assignments stay collectible. For any new fee, use{' '}
          <button onClick={() => navigate('/admin/fee/structure-builder')} className="font-bold underline">Fee Structure Builder</button>.
        </p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Legacy Fee Structures" description="No structures were ever created with the classic fee system for this institution." />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default FeeStructurePage;
