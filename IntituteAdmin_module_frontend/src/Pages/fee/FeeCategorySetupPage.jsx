import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { feeCategories as initialCat } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';

export const FeeCategorySetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [categories] = useState(initialCat);

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Category Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Billing Frequency', key: 'frequency' },
    { header: 'Mandatory / Optional', key: 'mandatory', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>{val ? 'MANDATORY' : 'OPTIONAL'}</span> },
    { header: 'Description', key: 'description' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Category Master Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure fee heads (Tuition, Exam, Bus, Hostel, Special Lab, Library)</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Add Fee Category" onAddClick={() => notifySuccess('Add Fee Category Modal')} />
      <DataTable columns={columns} data={categories} />
    </div>
  );
};

export default FeeCategorySetupPage;
