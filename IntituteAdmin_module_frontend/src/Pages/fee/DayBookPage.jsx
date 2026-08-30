import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const DayBookPage = () => {
  const { notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayBook, setDayBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDay = useCallback(() => {
    setLoading(true);
    feeService.getDayBook(date)
      .then((res) => setDayBook(res.data))
      .catch((err) => notifyError(`Failed to load day book: ${err.message}`))
      .finally(() => setLoading(false));
  }, [date, notifyError]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const columns = [
    { header: 'Receipt No', key: 'receipt', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.receiptNumber || '—'}</span> },
    { header: 'Time', key: 'paidAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span> },
    { header: 'Payment Mode', key: 'paymentMode', render: (val) => <span className="font-semibold text-purple-600">{val.replace('_', ' ')}</span> },
    { header: 'Student', key: 'student', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</span> },
    { header: 'Remarks', key: 'remarks', render: (val) => val || '—' },
    { header: 'Amount (₹)', key: 'amountPaid', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Day Book Transaction Audit</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chronological log of every fee transaction recorded on the selected date, across all payment modes</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : !dayBook || dayBook.payments.length === 0 ? (
        <EmptyState title="No Transactions" description="No fee payments were recorded on this date." />
      ) : (
        <>
          <DataTable columns={columns} data={dayBook.payments} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-slate-500">Cash</p>
              <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">₹{dayBook.cashTotal.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-slate-500">Bank / Digital</p>
              <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">₹{dayBook.bankTotal.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 rounded-xl">
              <p className="text-slate-500">Grand Total</p>
              <p className="font-mono font-bold text-lg text-emerald-700">₹{dayBook.grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DayBookPage;
