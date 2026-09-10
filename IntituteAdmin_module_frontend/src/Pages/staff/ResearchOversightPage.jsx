import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import researchService from '../../services/researchService';
import { FlaskConical, ExternalLink } from 'lucide-react';

const TYPE_LABELS = { JOURNAL: 'Journal', CONFERENCE: 'Conference', PATENT: 'Patent', BOOK_CHAPTER: 'Book Chapter' };

/** Institution-wide view of every publication faculty have recorded — read-only here,
 * since authoring a publication belongs to the staff member on their own portal. */
export const ResearchOversightPage = () => {
  const { notifyError } = useNotification();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    researchService.getAll()
      .then((res) => setPublications(res.data || []))
      .catch((err) => notifyError(`Failed to load research records: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const columns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Type', key: 'publicationType', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{TYPE_LABELS[val] || val}</span> },
    {
      header: 'Author', key: 'staff', sortable: false,
      render: (val) => val ? (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{val.firstName} {val.lastName}</p>
          <p className="text-[10px] text-slate-400">{val.department?.name || val.designation}</p>
        </div>
      ) : '—',
    },
    { header: 'Journal / Venue', key: 'journalName', render: (val) => val || '—' },
    { header: 'Date', key: 'publicationDate', render: (val) => new Date(val).toLocaleDateString('en-IN') },
    {
      header: 'Link', key: 'doiOrLink', sortable: false,
      render: (val) => val ? (
        <a href={val.startsWith('http') ? val : `https://${val}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> View
        </a>
      ) : '—',
    },
  ];

  const filtered = publications.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    `${p.staff?.firstName} ${p.staff?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Research & Publications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every paper, patent, conference talk and book chapter faculty have recorded, institution-wide</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          {publications.length} Records
        </span>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by title or author..." onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No Research Records Yet" description="Faculty publications will show up here automatically once staff add them from their own portal." />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default ResearchOversightPage;
