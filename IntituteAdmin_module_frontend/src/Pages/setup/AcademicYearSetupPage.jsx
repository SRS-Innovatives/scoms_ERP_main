import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { academicYears as initialYears } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Plus, CheckCircle, Edit, Trash2 } from 'lucide-react';

export const AcademicYearSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [years, setYears] = useState(initialYears);
  const [search, setSearch] = useState('');

  const columns = [
    { header: 'Academic Year', key: 'year', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'End Date', key: 'endDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status !== 'Active' && (
            <button
              onClick={() => {
                setYears(years.map((y) => ({ ...y, status: y.id === row.id ? 'Active' : 'Completed' })));
                notifySuccess(`Set ${row.year} as the active Academic Year!`);
              }}
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100"
            >
              Set Active
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Year Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage academic sessions, start/end dates, and set active session</p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search academic year..."
        addLabel="Add Academic Year"
        onAddClick={() => notifySuccess('Opened New Academic Year Modal')}
      />

      <DataTable columns={columns} data={years.filter((y) => y.year.toLowerCase().includes(search.toLowerCase()))} />
    </div>
  );
};

export default AcademicYearSetupPage;
