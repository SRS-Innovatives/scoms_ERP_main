import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import transportService from '../../services/transportService';
import ErrorState from '../../components/common/ErrorState';

export const TransportFeePage = () => {
  const { notifyError } = useNotification();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    transportService.getRoutes()
      .then((res) => setRoutes(res.data || []))
      .catch((err) => { notifyError(`Failed to load transport fee structure: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Corridor Name', key: 'routeName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Route', key: 'startPoint', sortable: false, render: (_, row) => `${row.startPoint} → ${row.endPoint}` },
    { header: 'Monthly Fee (₹)', key: 'monthlyFare', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Annual Fee (₹)', key: 'monthlyFare2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{(row.monthlyFare * 12).toLocaleString()}</span> },
    { header: 'Bus Pass Holders', key: '_count', sortable: false, render: (val) => `${val?.mappings ?? 0} students` },
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Transport Fee Structure</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Route-wise monthly and annual bus fee tariff — edit rates under Route Management</p>
      </div>

      <DataTable columns={columns} data={routes} />
    </div>
  );
};

export default TransportFeePage;
