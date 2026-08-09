import React from 'react';
import SummaryCard from '../../components/common/SummaryCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { chartData, feeTransactions } from '../../data/mockData';
import { CreditCard, TrendingUp, DollarSign, Wallet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FeeDashboardPage = () => {
  const navigate = useNavigate();

  const columns = [
    { header: 'Receipt No', key: 'receiptNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'studentName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Paid For', key: 'paidFor' },
    { header: 'Amount Paid', key: 'amountPaid', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Payment Mode', key: 'paymentMode', render: (val) => <span className="font-semibold text-slate-700">{val}</span> },
    { header: 'Txn ID', key: 'transactionId', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Management Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time fee collection, online payment gateway sync & pending dues breakdown</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/fee/collect')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee (POS / UPI / Cash)</span>
          </button>
          <button
            onClick={() => navigate('/admin/fee/challan')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Bank Challan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Expected Revenue" value="₹2.45 Crore" subtitle="AY 2025-26 Academic Year" icon={Wallet} color="indigo" />
        <SummaryCard title="Total Collected Fees" value="₹2.26 Crore" subtitle="92.4% Recovery Rate" icon={TrendingUp} trend="+18% vs last sem" trendType="up" color="emerald" />
        <SummaryCard title="Pending Outstanding Dues" value="₹18.45 Lakhs" subtitle="142 Defaulting Students" icon={CreditCard} trend="Action Required" trendType="down" color="rose" />
        <SummaryCard title="Today Collection Receipts" value="₹2,45,000" subtitle="14 Transactions Today" icon={DollarSign} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Fee Collection Graph" subtitle="Collection in INR" type="bar" data={chartData.monthlyCollection} height={250} />
        </div>
        <div>
          <ChartCard title="Category Pending Fee Distribution" subtitle="Uncollected Fee Heads" type="pie" data={chartData.feePendingBreakdown} height={250} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Fee Collection Transactions</h3>
        <DataTable columns={columns} data={feeTransactions} />
      </div>
    </div>
  );
};

export default FeeDashboardPage;
