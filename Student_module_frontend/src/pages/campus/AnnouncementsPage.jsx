import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2 } from 'lucide-react';
import announcementService from '../../services/announcementService';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    announcementService.getAll()
      .then((res) => setAnnouncements(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Campus Circulars & Announcements" subtitle="Official notices published for your institution, course, and section." />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <div className="glass-card p-8 rounded-3xl border border-rose-200 dark:border-rose-900 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>
      ) : announcements.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">No announcements posted yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((anc) => (
            <div key={anc.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  {anc.institution ? anc.institution.name : 'Platform'} • {new Date(anc.createdAt).toLocaleDateString('en-IN')}
                </span>
                <StatusBadge status={anc.priority} size="sm" />
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{anc.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{anc.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
