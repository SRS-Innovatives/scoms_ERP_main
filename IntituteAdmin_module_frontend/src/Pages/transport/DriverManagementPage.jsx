import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { transportRoutes } from '../../data/mockData';

export const DriverManagementPage = () => {
  const columns = [
    { header: 'Driver Name & Phone', key: 'driver', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Heavy Driving License No', key: 'id', render: () => <span className="font-mono text-xs font-bold">TN-09-2012-0049182</span> },
    { header: 'License Expiry', key: 'id', render: () => <span className="font-mono">20-May-2028</span> },
    { header: 'Assigned Bus', key: 'busNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Duty Status', key: 'id', render: () => <StatusBadge status="Active" text="On Route Duty" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Driver & Cleaner Staff Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Heavy driving license verification, emergency contact & police verification records</p>
      </div>

      <DataTable columns={columns} data={transportRoutes} />
    </div>
  );
};

export default DriverManagementPage;
