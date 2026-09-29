import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Loader2, X, Save, Users, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import placementDeskService from '../../services/placementDeskService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const emptyForm = { title: '', company: '', type: 'INTERNSHIP', location: '', compensation: '', description: '', eligibility: '', applicationDeadline: '' };

export const PlacementDeskPage = () => {
  const { success, error: showError } = useNotification();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [viewingApplications, setViewingApplications] = useState(null);
  const [applications, setApplications] = useState([]);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    placementDeskService.getPostings()
      .then((res) => setPostings(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load postings', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await placementDeskService.createPosting(form);
      success('Job posting published.');
      setForm(emptyForm); setFormOpen(false); fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to publish posting', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id) => {
    try { await placementDeskService.closePosting(id); success('Posting closed.'); fetchAll(); }
    catch (err) { showError(err.message || 'Failed to close posting', 'Update Failed'); }
  };

  const viewApplications = async (posting) => {
    setViewingApplications(posting);
    try {
      const res = await placementDeskService.getApplications(posting.id);
      setApplications(res.data?.applications || []);
    } catch (err) {
      showError(err.message || 'Failed to load applications', 'Load Failed');
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await placementDeskService.updateApplicationStatus(appId, status);
      success(`Application ${status.toLowerCase()}.`);
      const res = await placementDeskService.getApplications(viewingApplications.id);
      setApplications(res.data?.applications || []);
    } catch (err) {
      showError(err.message || 'Failed to update application', 'Update Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Placement Cell</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Post internships/placements and review student applications</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> New Posting
        </button>
      </div>

      {formOpen && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Briefcase className="w-4 h-4 text-sky-500" /> New Job Posting</h3>
            <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block font-semibold mb-1">Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Company</label><input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">{['INTERNSHIP', 'PLACEMENT'].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block font-semibold mb-1">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Compensation</label><input value={form.compensation} onChange={(e) => setForm({ ...form, compensation: e.target.value })} placeholder="e.g. ₹6 LPA / ₹15,000 stipend" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Application Deadline</label><input type="date" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            </div>
            <div><label className="block font-semibold mb-1">Eligibility</label><input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div><label className="block font-semibold mb-1">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
            <div className="flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50"><Save className="w-4 h-4" /> {submitting ? 'Publishing...' : 'Publish Posting'}</button></div>
          </form>
        </div>
      )}

      {viewingApplications && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Applications — {viewingApplications.title}</h3>
            <button onClick={() => setViewingApplications(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          {applications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No applications yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr><th className="text-left p-2 font-semibold">Student</th><th className="text-left p-2 font-semibold">Status</th><th className="p-2"></th></tr></thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{a.student?.firstName} {a.student?.lastName} ({a.student?.rollNumber})</td>
                    <td className="p-2">{a.status}</td>
                    <td className="p-2 flex gap-1">
                      <button onClick={() => updateStatus(a.id, 'SHORTLISTED')} className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-lg text-[11px] font-semibold">Shortlist</button>
                      <button onClick={() => updateStatus(a.id, 'SELECTED')} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold">Select</button>
                      <button onClick={() => updateStatus(a.id, 'REJECTED')} className="px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-semibold">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {postings.length === 0 ? (
        <EmptyState title="No Postings Yet" message="Publish your first internship/placement opening above." icon={Briefcase} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {postings.map((p) => (
            <div key={p.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'}`}>{p.type} • {p.status}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{p.title}</h3>
                  <p className="text-[11px] text-slate-500">{p.company} {p.location ? `• ${p.location}` : ''}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{p._count?.applications || 0} application(s)</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => viewApplications(p)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 rounded-lg hover:bg-sky-100"><Users className="w-3 h-3" /> Applications</button>
                {p.status !== 'CLOSED' && (
                  <button onClick={() => handleClose(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300 rounded-lg hover:bg-rose-100"><XCircle className="w-3 h-3" /> Close</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacementDeskPage;
