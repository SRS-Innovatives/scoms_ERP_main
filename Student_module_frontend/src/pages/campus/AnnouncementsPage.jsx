import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockAnnouncements } from '../../data/mockStudentData';

export const AnnouncementsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Campus Circulars & Announcements" subtitle="Official notices published by Principal, HOD, and Examination Cell." />

      <div className="space-y-4">
        {mockAnnouncements.map((anc) => (
          <div key={anc.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                {anc.category} • {anc.date}
              </span>
              <StatusBadge status={anc.priority} size="sm" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{anc.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{anc.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
