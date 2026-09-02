import React, { useState, useEffect, useCallback } from 'react';
import ChartCard from '../../components/common/ChartCard';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

const CATEGORY_LABELS = {
  TUITION_FEE: 'Tuition', EXAM_FEE: 'Exam', LIBRARY_FEE: 'Library', TRANSPORT_FEE: 'Transport',
  HOSTEL_FEE: 'Hostel', LAB_FEE: 'Lab', ADMISSION_FEE: 'Admission', DEVELOPMENT_FEE: 'Development', OTHER_FEE: 'Other',
};

export const FeeReportsPage = () => {
  const { notifyError } = useNotification();
  const [from, setFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(() => {
    setLoading(true);
    feeService.getReports({ from, to })
      .then((res) => setReport(res.data))
      .catch((err) => notifyError(`Failed to load report: ${err.message}`))
      .finally(() => setLoading(false));
  }, [from, to, notifyError]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Financial & Fee Collection Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Head-wise and mode-wise revenue reports for a chosen date range</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
          <span className="text-slate-400">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-100">
              <p className="text-xs text-slate-500">Total Collected</p>
              <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono">₹{report.totalCollected.toLocaleString()}</p>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-100">
              <p className="text-xs text-slate-500">Total Transactions</p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">{report.totalTransactions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Collection by Fee Category"
              type="bar"
              data={report.byCategory.map((c) => ({ amount: c.amount, label: CATEGORY_LABELS[c.category] || c.category }))}
              height={220}
            />
            <ChartCard
              title="Collection by Payment Mode"
              type="pie"
              data={report.byMode.map((m) => ({ amount: m.amount, name: m.mode.replace('_', ' ') }))}
              height={220}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default FeeReportsPage;
