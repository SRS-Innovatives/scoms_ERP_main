import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { inventoryAssets } from '../../data/mockData';

export const LabEquipmentPage = () => {
  const columns = [
    { header: 'Equipment ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Instrument Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Lab Location', key: 'location' },
    { header: 'Calibration Due Date', key: 'id', render: () => <span className="font-mono text-xs font-bold text-amber-600">15-Nov-2026</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status="Active" text="Calibrated & Operational" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Engineering & Science Lab Equipment</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">VLSI kits, CROs, IC testers, IC Engines, Universal Testing Machine & CNC Lathe</p>
      </div>

      <DataTable columns={columns} data={inventoryAssets} />
    </div>
  );
};

export default LabEquipmentPage;
