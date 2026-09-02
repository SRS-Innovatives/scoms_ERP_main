import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Briefcase, Loader2, Inbox } from 'lucide-react';
import jobPostingService from '../../services/jobPostingService';

const STATUS_LABELS = { APPLIED: 'Applied', SHORTLISTED: 'Shortlisted', SELECTED: 'Selected', REJECTED: 'Not Selected' };

export const InternshipsPage = ({ postingType = 'INTERNSHIP', title = 'Campus Internships & Training', subtitle = 'Apply for verified corporate internships posted by your institution.' }) => {
  const { success, error: showError } = useNotification();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    jobPostingService.getPostings(postingType)
      .then((res) => setPostings(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load postings', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [postingType, showError]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (posting) => {
    setApplying(posting.id);
    try {
      await jobPostingService.apply(posting.id);
      success(`Applied for ${posting.title} at ${posting.company}`, 'Application Sent');
      load();
    } catch (err) {
      showError(err.message || 'Failed to apply', 'Application Failed');
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      {postings.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> No openings posted yet — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {postings.map((item) => (
            <div key={item.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" /> {item.company} {item.location ? `• ${item.location}` : ''}
                  </p>
                </div>
                {item.myApplication && <StatusBadge status={STATUS_LABELS[item.myApplication.status] || item.myApplication.status} size="sm" />}
              </div>

              {item.compensation && <p className="font-bold text-xs text-emerald-600">{item.compensation}</p>}
              {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
              {item.eligibility && <p className="text-[11px] text-slate-400">Eligibility: {item.eligibility}</p>}
              {item.applicationDeadline && <p className="text-[11px] text-slate-400">Apply before {new Date(item.applicationDeadline).toLocaleDateString()}</p>}

              {item.myApplication ? (
                <button disabled className="w-full py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  {STATUS_LABELS[item.myApplication.status] || item.myApplication.status}
                </button>
              ) : (
                <button
                  onClick={() => handleApply(item)}
                  disabled={applying === item.id}
                  className="w-full py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50"
                >
                  {applying === item.id ? 'Applying...' : 'Submit Application'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
