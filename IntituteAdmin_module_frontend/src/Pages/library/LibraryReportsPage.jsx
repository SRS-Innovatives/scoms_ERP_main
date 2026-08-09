import React from 'react';
import DataTable from '../../components/common/DataTable';
import { libraryBooks } from '../../data/mockData';

export const LibraryReportsPage = () => {
  const columns = [
    { header: 'Book ID', key: 'id' },
    { header: 'Title', key: 'title' },
    { header: 'Total Copies', key: 'copies' },
    { header: 'Issued', key: 'copies', render: (val, row) => val - row.available },
    { header: 'Available', key: 'available' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Stock & Circulation Audit Reports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Total books inventory, monthly borrowing trends & unreturned books</p>
      </div>

      <DataTable columns={columns} data={libraryBooks} />
    </div>
  );
};

export default LibraryReportsPage;
