import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const CampusSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const campuses = [
    { id: 'CAM-01', code: 'MAIN-OMR', name: 'Main City Campus - OMR', location: 'OMR, Chennai', status: 'Active', capacity: 4500 },
    { id: 'CAM-02', code: 'TECH-CBE', name: 'Coimbatore Technical Campus', location: 'Neelambur, CBE', status: 'Active', capacity: 3200 }
  ];

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Campus Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Location', key: 'location' },
    { header: 'Student Capacity', key: 'capacity', render: (val) => `${val.toLocaleString()} Seats` },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Campus Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure multi-campus branches, locations, and infrastructure limits</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Campus Branch" onAddClick={() => notifySuccess('Add Campus Modal')} />
      <DataTable columns={columns} data={campuses} />
    </div>
  );
};

export default CampusSetupPage;
