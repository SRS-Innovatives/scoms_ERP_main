import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { studentsList } from '../../data/mockData';

export const MessFeePage = () => {
  const hostelers = studentsList.filter((s) => s.hostel !== 'Day Scholar');

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Hosteler Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Monthly Mess Bill (₹)', key: 'id', render: () => <span className="font-mono font-bold text-slate-900">₹4,850</span> },
    { header: 'Mess Rebate Days', key: 'id', render: () => <span className="font-mono">2 Days (Home Leave)</span> },
    { header: 'Status', key: 'feeStatus', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Mess Bill & Rebate Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Monthly mess dining bill calculation & mess leave rebate adjustments</p>
      </div>

      <DataTable columns={columns} data={hostelers} />
    </div>
  );
};

export default MessFeePage;
