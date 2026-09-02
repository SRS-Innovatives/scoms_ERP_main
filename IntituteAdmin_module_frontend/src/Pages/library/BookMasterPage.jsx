import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen } from 'lucide-react';
import libraryService from '../../services/libraryService';

const emptyForm = { title: '', author: '', isbn: '', category: '', totalCopies: '1' };

export const BookMasterPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    libraryService.getBooks()
      .then((res) => setBooks(res.data || []))
      .catch((err) => notifyError(`Failed to load books: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await libraryService.createBook(form);
      notifySuccess(`"${form.title}" added to the library catalog!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add book: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Book Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Author(s)', key: 'author' },
    { header: 'ISBN Code', key: 'isbn', render: (val) => <span className="font-mono text-xs">{val || '—'}</span> },
    { header: 'Category', key: 'category', render: (val) => val || '—' },
    { header: 'Total Copies', key: 'totalCopies', render: (val) => `${val} Copies` },
    { header: 'Available Copies', key: 'availableCopies', render: (val) => <span className={`font-bold ${val > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{val} Available</span> },
  ];

  const filtered = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Central Library Book Master Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Catalog of textbooks, reference books & the digital repository</p>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by title, author, ISBN..." addLabel="Add New Book" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Books Cataloged Yet" description="Add the first book to the library catalog." actionLabel="Add New Book" onAction={() => setModalOpen(true)} icon={BookOpen} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add New Book"
        icon={BookOpen}
        submitLabel="Add Book"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Book Title', required: true, span: 'full' },
          { name: 'author', label: 'Author(s)', required: true },
          { name: 'isbn', label: 'ISBN Code' },
          { name: 'category', label: 'Category (e.g. Reference, Fiction)' },
          { name: 'totalCopies', label: 'Total Copies', type: 'number', required: true },
        ]}
      />
    </div>
  );
};

export default BookMasterPage;
