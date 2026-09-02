import React, { useState, useEffect } from 'react';
import SummaryCard from '../../components/common/SummaryCard';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, TrendingUp, DollarSign, Wallet, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import feeService from '../../services/feeService';

export const FeeDashboardPage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([feeService.getDashboard(), feeService.getPendingFees()])
      .then(([dashRes, pendingRes]) => {
        setSummary(dashRes.data);
        setPending((pendingRes.data || []).slice(0, 8));
      })
      .catch((err) => notifyError(`Failed to load fee dashboard: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-rose-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Pending (₹)', key: 'dueAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
  ];

  const recoveryRate = summary && summary.totalPrescribed > 0
    ? Math.round(((summary.totalCollected) / (summary.totalPrescribed - summary.totalDiscount || 1)) * 100)
    : 0;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Management Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time fee collection summary and pending dues breakdown</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/fee/collect')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all">
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
          <button onClick={() => navigate('/admin/fee/challan')} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors">
            <FileText className="w-4 h-4" />
            <span>Bank Challan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Prescribed Fees" value={`₹${summary.totalPrescribed.toLocaleString()}`} subtitle={`${summary.totalAssignments} assignments`} icon={Wallet} color="indigo" />
        <SummaryCard title="Total Collected" value={`₹${summary.totalCollected.toLocaleString()}`} subtitle={`${recoveryRate}% Recovery Rate`} icon={TrendingUp} trend={`${recoveryRate}%`} trendType="up" color="emerald" />
        <SummaryCard title="Pending Outstanding Dues" value={`₹${summary.totalOutstanding.toLocaleString()}`} subtitle={`${pending.length}+ defaulting entries`} icon={CreditCard} trend="Action Required" trendType="down" color="rose" />
        <SummaryCard title="Today's Collection" value={`₹${summary.collectedToday.toLocaleString()}`} subtitle={`${summary.paymentsToday} transactions today`} icon={DollarSign} color="amber" />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-slate-500">This Month Collected</p>
          <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">₹{summary.collectedThisMonth.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-500">Transactions This Month</p>
          <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">{summary.paymentsThisMonth}</p>
        </div>
        <div>
          <p className="text-slate-500">Total Scholarships / Discounts</p>
          <p className="font-mono font-bold text-lg text-emerald-600">₹{summary.totalDiscount.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Pending Fee Dues</h3>
        {pending.length === 0 ? (
          <EmptyState title="No Pending Dues" description="Every student's fee assignment is fully paid." />
        ) : (
          <DataTable columns={columns} data={pending} />
        )}
      </div>
    </div>
  );
};

export default FeeDashboardPage;
