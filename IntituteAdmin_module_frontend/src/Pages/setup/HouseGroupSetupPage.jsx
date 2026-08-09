import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useNotification } from '../../context/NotificationContext';

export const HouseGroupSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const houses = [
    { id: 'HS-RED', name: 'Ruby House (Red)', mentor: 'Dr. V. Lakshmi', color: 'bg-rose-500', members: 420, points: 1450 },
    { id: 'HS-BLUE', name: 'Sapphire House (Blue)', mentor: 'Prof. P. Venkatesh', color: 'bg-sky-500', members: 410, points: 1620 },
    { id: 'HS-GREEN', name: 'Emerald House (Green)', mentor: 'Dr. K. Meenakshi', color: 'bg-emerald-500', members: 430, points: 1390 },
    { id: 'HS-YELLOW', name: 'Topaz House (Yellow)', mentor: 'Prof. S. Malathi', color: 'bg-amber-500', members: 405, points: 1510 }
  ];

  const columns = [
    {
      header: 'House Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 rounded-full ${row.color}`} />
          <span className="font-bold text-slate-900 dark:text-white">{val}</span>
        </div>
      )
    },
    { header: 'Faculty House Mentor', key: 'mentor' },
    { header: 'Student Members', key: 'members', render: (val) => `${val} Students` },
    { header: 'Annual Sports/Tech Points', key: 'points', render: (val) => <span className="font-mono font-bold text-indigo-600">{val} Points</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">House / Group Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Inter-house cultural, sports & technical competition group allocation</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add House" onAddClick={() => notifySuccess('Add House')} />
      <DataTable columns={columns} data={houses} />
    </div>
  );
};

export default HouseGroupSetupPage;
