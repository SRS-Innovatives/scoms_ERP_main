import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import grievanceService from '../../services/grievanceService';
import ErrorState from '../../components/common/ErrorState';

const displayStatus = (status) => {
  if (status === 'SUBMITTED') return 'Submitted';
  if (status === 'UNDER_REVIEW') return 'Under Review';
  if (status === 'RESOLVED') return 'Resolved';
  return status;
};

export const GrievancePage = () => {
  const { success, error: showError } = useNotification();
  const [subject, setSubject] = useState('');
  const [complaint, setComplaint] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    grievanceService.getMyGrievances()
      .then((res) => setGrievances(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load grievances', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grievanceService.submit({ subject, description: complaint });
      success('Confidential grievance logged to Student Cell.', 'Grievance Registered');
      setSubject('');
      setComplaint('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to submit grievance', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Confidential Student Grievances & Support" subtitle="Log complaints regarding academics, ragging protection, or campus facilities." />

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Submit New Grievance</h3>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (e.g. Library Wi-Fi not working)"
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
        />
        <textarea
          rows={3}
          required
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Describe issue confidentially..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
        ></textarea>
        <button type="submit" disabled={submitting} className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : grievances.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-slate-300" /> No grievances logged yet.
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => (
            <div key={g.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs gap-3">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{g.subject}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{g.resolution || g.description}</p>
              </div>
              <StatusBadge status={displayStatus(g.status)} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GrievancePage;
