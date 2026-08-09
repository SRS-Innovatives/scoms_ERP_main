import React from 'react';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import { chartData, feeTransactions } from '../../data/mockData';

export const FeeReportsPage = () => {
  const columns = [
    { header: 'Receipt No', key: 'receiptNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student', key: 'studentName' },
    { header: 'Particulars', key: 'paidFor' },
    { header: 'Amount', key: 'amountPaid', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Payment Mode', key: 'paymentMode' },
    { header: 'Collected By', key: 'collectedBy' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Financial & Fee Collection Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Head-wise revenue reports, cashier settlement & bank scroll statements</p>
      </div>

      <ChartCard title="Monthly Fee Collection Analytics" type="bar" data={chartData.monthlyCollection} height={250} />
      <DataTable columns={columns} data={feeTransactions} />
    </div>
  );
};

export default FeeReportsPage;
