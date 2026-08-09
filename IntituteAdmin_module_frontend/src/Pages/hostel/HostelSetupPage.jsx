import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { hostelBlocks as initialBlocks } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Home, Plus } from 'lucide-react';

export const HostelSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [blocks] = useState(initialBlocks);

  const columns = [
    { header: 'Hostel ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Hostel Block Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Home className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Resident Warden', key: 'warden', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'Total Capacity', key: 'capacity', render: (val) => `${val} Beds` },
    { header: 'Occupied Beds', key: 'occupied', render: (val) => <span className="font-bold text-indigo-600">{val} Occupied</span> },
    { header: 'Mess & Dining Type', key: 'messType' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Blocks & Mess Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Boys & Girls hostel blocks, room inventory, warden assignment & dining mess configuration</p>
        </div>

        <button onClick={() => notifySuccess('Add Hostel Block Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Hostel Block</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search hostel block..." />
      <DataTable columns={columns} data={blocks} />
    </div>
  );
};

export default HostelSetupPage;
