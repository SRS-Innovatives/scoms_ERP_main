import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const BatchSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const batches = [
    { id: 'BAT-2021-25', name: 'Batch 2021 - 2025', passoutYear: '2025', currentSem: 'Sem 8', totalStudents: 780, status: 'Graduating' },
    { id: 'BAT-2022-26', name: 'Batch 2022 - 2026', passoutYear: '2026', currentSem: 'Sem 6', totalStudents: 850, status: 'Active' },
    { id: 'BAT-2023-27', name: 'Batch 2023 - 2027', passoutYear: '2027', currentSem: 'Sem 4', totalStudents: 910, status: 'Active' },
    { id: 'BAT-2024-28', name: 'Batch 2024 - 2028', passoutYear: '2028', currentSem: 'Sem 2', totalStudents: 960, status: 'Active' }
  ];

  const columns = [
    { header: 'Batch ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Batch Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Passout Year', key: 'passoutYear', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Current Term', key: 'currentSem' },
    { header: 'Total Students', key: 'totalStudents', render: (val) => `${val} Enrolled` },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Batch Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage 4-year / 3-year student admission cohort batches</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create Batch" onAddClick={() => notifySuccess('Create Batch')} />
      <DataTable columns={columns} data={batches} />
    </div>
  );
};

export default BatchSetupPage;
