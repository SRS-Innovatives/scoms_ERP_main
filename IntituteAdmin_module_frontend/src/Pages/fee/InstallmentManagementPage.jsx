import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const InstallmentManagementPage = () => {
  const installments = [
    { student: 'Aditya V. Karthik', rollNo: '21CS102', instNo: 'Instalment 1 of 2', amount: 25000, dueDate: '31-Aug-2025', status: 'Pending' },
    { student: 'Siddharth N. Nair', rollNo: '22EC044', instNo: 'Instalment 2 of 2', amount: 15000, dueDate: '15-Sep-2025', status: 'Pending' }
  ];

  const columns = [
    { header: 'Student Name', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Instalment Plan', key: 'instNo' },
    { header: 'Instalment Amount (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Installment Plan Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure multi-part installment schedules for students requesting fee extension</p>
      </div>

      <DataTable columns={columns} data={installments} />
    </div>
  );
};

export default InstallmentManagementPage;
