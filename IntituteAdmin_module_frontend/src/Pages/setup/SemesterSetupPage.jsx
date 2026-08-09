import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const SemesterSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const semesters = [
    { id: 'SEM-01', name: 'Semester 1 (Odd)', term: 'First Year', startDate: '2025-08-01', endDate: '2025-12-20', status: 'Active' },
    { id: 'SEM-02', name: 'Semester 2 (Even)', term: 'First Year', startDate: '2026-01-05', endDate: '2026-05-15', status: 'Upcoming' },
    { id: 'SEM-06', name: 'Semester 6 (Even)', term: 'Third Year', startDate: '2025-06-01', endDate: '2025-11-30', status: 'Active' }
  ];

  const columns = [
    { header: 'ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Semester Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Year Level', key: 'term' },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'End Date', key: 'endDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Semester Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage term schedules, semester start/end dates for odd/even terms</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Semester" onAddClick={() => notifySuccess('Add Semester')} />
      <DataTable columns={columns} data={semesters} />
    </div>
  );
};

export default SemesterSetupPage;
