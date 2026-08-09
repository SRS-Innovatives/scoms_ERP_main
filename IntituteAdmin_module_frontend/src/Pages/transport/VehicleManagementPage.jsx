import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { transportRoutes } from '../../data/mockData';

export const VehicleManagementPage = () => {
  const columns = [
    { header: 'Bus Reg Number', key: 'busNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Vehicle Type', key: 'id', render: () => 'Ashok Leyland 55-Seater AC Bus' },
    { header: 'FC Expiry Date', key: 'id', render: () => <span className="font-mono">31-Dec-2026</span> },
    { header: 'Insurance Valid Till', key: 'id', render: () => <span className="font-mono">15-Oct-2026</span> },
    { header: 'GPS Tracker Status', key: 'id', render: () => <StatusBadge status="Active" text="GPS ONLINE" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fleet & Vehicle Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Fitness Certificate (FC), Insurance renewals, RTO permits & live GPS tracking</p>
      </div>

      <DataTable columns={columns} data={transportRoutes} />
    </div>
  );
};

export default VehicleManagementPage;
