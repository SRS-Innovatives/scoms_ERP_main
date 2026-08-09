import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { departments as initialDepts } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';

export const DepartmentSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [depts] = useState(initialDepts);

  const columns = [
    { header: 'Dept Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Department Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Head of Dept (HOD)', key: 'hod', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Staff Strength', key: 'staffCount', render: (val) => `${val} Faculty` },
    { header: 'Student Count', key: 'studentCount', render: (val) => `${val} Enrolled` },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Academic & Non-academic department master configuration</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search department name or HOD..."
        addLabel="Add Department"
        onAddClick={() => notifySuccess('Add Department Modal Opened')}
      />

      <DataTable columns={columns} data={depts.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()))} />
    </div>
  );
};

export default DepartmentSetupPage;
