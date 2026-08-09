import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { announcements as initialAnnouncements } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Megaphone, Plus } from 'lucide-react';

export const AnnouncementsPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [list] = useState(initialAnnouncements);

  const columns = [
    { header: 'Announcement Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Category', key: 'category', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">{val}</span> },
    { header: 'Target Audience', key: 'targetAudience' },
    { header: 'Author / Cell', key: 'author' },
    { header: 'Publish Date', key: 'publishDate', render: (val) => <span className="font-mono">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Announcements & Campus News Broadcast</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Post announcements to student mobile app, web portal & campus display boards</p>
        </div>

        <button onClick={() => notifySuccess('Post Announcement Modal')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Post New Announcement</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search announcement..." />
      <DataTable columns={columns} data={list} />
    </div>
  );
};

export default AnnouncementsPage;
