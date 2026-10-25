import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const CashBookPage = () => {
  const { notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayBook, setDayBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDay = useCallback(() => {
    setLoading(true);
    setError(false);
    feeService.getDayBook(date)
      .then((res) => setDayBook(res.data))
      .catch((err) => { notifyError(`Failed to load cash book: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [date, notifyError]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const cashEntries = (dayBook?.payments || []).filter((p) => p.paymentMode === 'CASH');
  let running = 0;
  const rows = cashEntries.map((p) => {
    running += p.amountPaid;
    return { ...p, balance: running };
  });

  const columns = [
    { header: 'Receipt No', key: 'receipt', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.receiptNumber || '—'}</span> },
    { header: 'Time', key: 'paidAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span> },
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName} ({val?.rollNumber})</span> },
    { header: 'Cash Received (₹)', key: 'amountPaid', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Running Balance (₹)', key: 'balance', render: (val) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{val.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cash Book Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Physical cash receipts and running cashier balance for the selected day</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchDay} />
      ) : rows.length === 0 ? (
        <EmptyState title="No Cash Transactions" description="No cash fee payments were recorded on this date." />
      ) : (
        <>
          <DataTable columns={columns} data={rows} />
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 rounded-xl text-xs flex justify-between">
            <span className="text-slate-500">Total Cash Collected:</span>
            <span className="font-mono font-bold text-emerald-700">₹{running.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CashBookPage;
