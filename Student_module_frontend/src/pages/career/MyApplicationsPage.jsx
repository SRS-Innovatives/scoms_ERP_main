import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Briefcase, Loader2, Inbox } from 'lucide-react';
import jobPostingService from '../../services/jobPostingService';
import ErrorState from '../../components/common/ErrorState';

const STATUS_LABELS = { APPLIED: 'Applied', SHORTLISTED: 'Shortlisted', SELECTED: 'Selected', REJECTED: 'Not Selected' };
const TYPE_LABELS = { INTERNSHIP: 'Internship', PLACEMENT: 'Placement' };

export const MyApplicationsPage = () => {
  const { error: showError } = useNotification();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    jobPostingService.getMyApplications()
      .then((res) => setApplications(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load applications', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Applications" subtitle="Every internship and placement application you've submitted, across both boards, most recent first." />

      {applications.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> You haven't applied to anything yet.
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{app.jobPosting?.title}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">{TYPE_LABELS[app.jobPosting?.type] || app.jobPosting?.type}</span>
                </div>
                <p className="text-slate-500 flex items-center gap-1 mt-0.5"><Briefcase className="w-3.5 h-3.5" /> {app.jobPosting?.company}</p>
                <p className="text-[11px] text-slate-400 mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={STATUS_LABELS[app.status] || app.status} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
