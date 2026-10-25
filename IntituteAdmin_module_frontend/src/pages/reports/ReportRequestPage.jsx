import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const CATEGORIES = ['STUDENT', 'STAFF', 'ACADEMIC', 'ATTENDANCE', 'EXAMINATION', 'FEES', 'FINANCE', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'ADMISSION', 'COMMUNICATION', 'ADMINISTRATION', 'ANALYTICS', 'CUSTOM'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_STYLE = {
  REQUESTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-sky-100 text-sky-700',
  IN_DEVELOPMENT: 'bg-indigo-100 text-indigo-700',
  READY: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

/** ReportRequestForm — lets an Institute Admin ask for a report that isn't in the catalog
 * yet. Super Admin reviews it and, once built, it appears in the catalog automatically —
 * no new frontend page is ever needed for it. */
export const ReportRequestPage = () => {
  const { error: showError, success } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const load = () => {
    setLoading(true);
    setError(false);
    reportService.getRequests()
      .then((res) => setRequests(res.data || []))
      .catch((err) => { showError(`Failed to load report requests: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await reportService.createRequest({ title, category, description, requirements, priority });
      success('Report request submitted — your Super Admin will review it.');
      setTitle(''); setDescription(''); setRequirements('');
      load();
    } catch (err) {
      showError(`Failed to submit request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-indigo-500" /> Request New Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Need a report that's not in the catalog? Ask your Super Admin to build it.</p>
        </div>
        <Link to="/admin/reports/center" className="text-xs font-semibold text-indigo-600 hover:underline">← Back to Reports</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Report Name *</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Students below 75% attendance with pending fees"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Purpose / Description *</label>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should this report show, and why do you need it?"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Required Fields / Filters (optional)</label>
          <textarea rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g. Academic Year, Department, Attendance %, Outstanding Fee threshold"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Request
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Institution's Requests</h3>
        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No report requests submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-[11px] text-slate-500">{r.category} • {new Date(r.createdAt).toLocaleDateString()}</p>
                  {r.adminRemarks && <p className="text-[11px] text-slate-500 mt-0.5 italic">Remarks: {r.adminRemarks}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-700'}`}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportRequestPage;
