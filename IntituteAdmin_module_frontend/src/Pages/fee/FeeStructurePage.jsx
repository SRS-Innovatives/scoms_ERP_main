import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { feeStructures as initialStructures } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';

export const FeeStructurePage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [structures] = useState(initialStructures);

  const columns = [
    { header: 'Structure ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Course / Branch', key: 'course', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Fee Category', key: 'category' },
    { header: 'Semester / Term', key: 'semester' },
    { header: 'Prescribed Fee (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono text-rose-600 font-semibold">{val}</span> },
    { header: 'Late Fine / Day', key: 'lateFeePerDay', render: (val) => <span className="font-mono">₹{val}/day</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Structure Master Configuration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Map fee amounts, due dates, late payment fines per course & semester</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create Fee Structure" onAddClick={() => notifySuccess('Create Fee Structure')} />
      <DataTable columns={columns} data={structures} />
    </div>
  );
};

export default FeeStructurePage;
