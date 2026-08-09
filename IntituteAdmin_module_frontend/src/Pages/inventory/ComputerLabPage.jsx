import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const ComputerLabPage = () => {
  const labs = [
    { labName: 'CSE AI & Cloud Supercomputing Lab', pcs: 60, specs: 'Dell OptiPlex i7 16GB, RTX 3060', os: 'Ubuntu 24.04 LTS / Win 11', network: '1 Gbps Fibre' },
    { labName: 'ECE VLSI & Embedded Systems Lab', pcs: 45, specs: 'HP ProDesk i5 16GB, Cadence EDA', os: 'Windows 11 Pro', network: '1 Gbps Fibre' }
  ];

  const columns = [
    { header: 'Lab Name', key: 'labName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'System Count', key: 'pcs', render: (val) => <span className="font-mono font-bold text-indigo-600">{val} PCs</span> },
    { header: 'Hardware Specification', key: 'specs' },
    { header: 'OS & Licensed Software', key: 'os' },
    { header: 'LAN Connectivity', key: 'network', render: (val) => <StatusBadge status="Active" text={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Computer Lab Infrastructure</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">High-performance computing workstations, server racks, switch routers & software licenses</p>
      </div>

      <DataTable columns={columns} data={labs} />
    </div>
  );
};

export default ComputerLabPage;
