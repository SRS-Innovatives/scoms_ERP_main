import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import reportManagementService from '../../services/reportManagementService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const STATUSES = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'IN_DEVELOPMENT', 'READY', 'REJECTED'];
const STATUS_STYLE = {
  REQUESTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-sky-100 text-sky-700',
  IN_DEVELOPMENT: 'bg-indigo-100 text-indigo-700',
  READY: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

/** Super Admin reviews institution-submitted custom report requests. Moving a request to
 * READY doesn't auto-build the report — Super Admin still creates it in the Report Catalog
 * (using the request's own requirements as the spec) and assigns it to the institution;
 * this screen tracks the workflow status through that process. */
export const ReportRequestReviewPage = () => {
  const { error: showError, success } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [remarksDraft, setRemarksDraft] = useState({});

  const load = () => {
    setLoading(true);
    setError(false);
    reportManagementService.getReportRequests()
      .then((res) => setRequests(res.data || []))
      .catch((err) => { showError(`Failed to load report requests: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (id, status) => {
    try {
      await reportManagementService.updateReportRequest(id, { status, adminRemarks: remarksDraft[id] });
      success(`Request marked ${status.replace(/_/g, ' ')}.`);
      load();
    } catch (err) {
      showError(`Failed: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-amber-500" /> Custom Report Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Requests submitted by institutions for reports not yet in the catalog.</p>
        </div>
        <Link to="/super-admin/reports" className="text-xs font-semibold text-amber-600 hover:underline">← Back to Report Catalog</Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          No report requests submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-[11px] text-slate-500">{r.institution?.name} • {r.category} • Priority: {r.priority}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{r.description}</p>
                  {r.requirements && <p className="text-[11px] text-slate-500 mt-1">Requirements: {r.requirements}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[r.status]}`}>{r.status.replace(/_/g, ' ')}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Admin remarks..."
                  value={remarksDraft[r.id] ?? r.adminRemarks ?? ''}
                  onChange={(e) => setRemarksDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <select
                  value={r.status}
                  onChange={(e) => handleUpdate(r.id, e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportRequestReviewPage;
