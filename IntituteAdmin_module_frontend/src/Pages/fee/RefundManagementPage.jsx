import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const RefundManagementPage = () => {
  const refunds = [
    { student: 'A. Rajesh Kumar', reason: 'Excess Caution Deposit Refund on Graduation', refundAmount: 5000, bankAccount: 'SBI - 3049182941', status: 'Processed' }
  ];

  const columns = [
    { header: 'Student Name', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Refund Reason', key: 'reason' },
    { header: 'Refund Amount (₹)', key: 'refundAmount', render: (val) => <span className="font-mono font-bold text-indigo-600">₹{val.toLocaleString()}</span> },
    { header: 'Bank A/C Details', key: 'bankAccount', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Refund & Caution Deposit Returns</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Process caution deposit refunds, excess payments & admission cancellation refunds</p>
      </div>

      <DataTable columns={columns} data={refunds} />
    </div>
  );
};

export default RefundManagementPage;
