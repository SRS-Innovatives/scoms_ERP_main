import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { libraryBooks as initialBooks } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, Plus } from 'lucide-react';

export const BookMasterPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [books] = useState(initialBooks);

  const columns = [
    { header: 'Book ID', key: 'id', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Book Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Author(s)', key: 'author' },
    { header: 'ISBN Code', key: 'isbn', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Total Copies', key: 'copies', render: (val) => `${val} Copies` },
    { header: 'Available Copies', key: 'available', render: (val) => <span className="font-bold text-emerald-600">{val} Available</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Central Library Book Master Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Barcode cataloging of textbooks, reference books, IEEE journals & digital repository</p>
        </div>

        <button onClick={() => notifySuccess('Add New Book Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by title, author, ISBN..." />
      <DataTable columns={columns} data={books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))} />
    </div>
  );
};

export default BookMasterPage;
