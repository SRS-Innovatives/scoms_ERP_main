import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { transportRoutes as initialRoutes } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Bus, Plus } from 'lucide-react';

export const RouteManagementPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [routes] = useState(initialRoutes);

  const columns = [
    { header: 'Route ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Route Corridor Name', key: 'routeName', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bus className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Assigned Bus Registration', key: 'busNo', render: (val) => <span className="font-mono font-bold">{val}</span> },
    { header: 'Driver Contact', key: 'driver' },
    { header: 'Capacity / Assigned', key: 'capacity', render: (val, row) => `${row.assignedStudents} / ${val} Students` },
    { header: 'Annual Bus Fee', key: 'fee', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Route Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pickup corridors, bus registration, seating capacity & driver mapping</p>
        </div>

        <button onClick={() => notifySuccess('Add Route Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Transport Route</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search bus route..." />
      <DataTable columns={columns} data={routes} />
    </div>
  );
};

export default RouteManagementPage;
