import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { transportRoutes } from '../../data/mockData';

export const TransportFeePage = () => {
  const columns = [
    { header: 'Route ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Corridor Name', key: 'routeName' },
    { header: 'Annual Bus Fee (₹)', key: 'fee', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Assigned Students', key: 'assignedStudents', render: (val) => `${val} Bus Pass Holders` }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Transport Fee Structure Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Distance slab-based annual bus fee tariff configuration</p>
      </div>

      <DataTable columns={columns} data={transportRoutes} />
    </div>
  );
};

export default TransportFeePage;
