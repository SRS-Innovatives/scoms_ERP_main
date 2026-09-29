import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const FeeCategorySetupPage = () => {
  const { notifyError } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCategories = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => { notifyError(`Failed to load fee categories: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Fee Head', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Structures Configured', key: 'structureCount' },
    { header: 'Total Amount Configured (₹)', key: 'totalConfigured', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Category Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Standard fee heads (Tuition, Exam, Bus, Hostel, Lab, Library) — select one when creating a Fee Structure</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={loadCategories} />
      ) : (
        <DataTable columns={columns} data={categories} />
      )}
    </div>
  );
};

export default FeeCategorySetupPage;
