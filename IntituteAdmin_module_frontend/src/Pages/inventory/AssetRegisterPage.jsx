import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { inventoryAssets as initialAssets } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Package, Plus } from 'lucide-react';

export const AssetRegisterPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [assets] = useState(initialAssets);

  const columns = [
    { header: 'Asset Tag ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Asset Description', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Campus Location / Room', key: 'location', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Quantity', key: 'qty', render: (val) => <span className="font-mono font-bold">{val} Units</span> },
    { header: 'Purchase Date', key: 'purchaseDate', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Asset Condition', key: 'status', render: (val) => <StatusBadge status="Active" text={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Fixed Asset Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Barcode asset tag tracking for furniture, projectors, servers & lab instruments</p>
        </div>

        <button onClick={() => notifySuccess('Add Asset Tag Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Asset Item</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search asset tag or name..." />
      <DataTable columns={columns} data={assets} />
    </div>
  );
};

export default AssetRegisterPage;
