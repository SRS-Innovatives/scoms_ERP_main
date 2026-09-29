import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = { organization: '', roleTitle: '', fromDate: '', toDate: '', description: '' };

export const ExperienceDetailsPage = () => {
  const { success, error: showError } = useNotification();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    profileService.getMyProfile()
      .then((res) => setExperiences(res.data.experiences || []))
      .catch((err) => { showError(err.message || 'Failed to load experience records', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await profileService.addExperience(form);
      success('Experience record added successfully!', 'Saved');
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to add experience', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" /> Teaching & Professional Experience
        </h3>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700">
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
          <input required placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input required placeholder="Role Held" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input required type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input type="date" placeholder="To (blank = current)" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <button type="submit" disabled={submitting} className="px-3 bg-sky-600 text-white rounded-lg font-semibold disabled:opacity-50">{submitting ? '...' : 'Add'}</button>
        </form>
      )}

      {experiences.length === 0 ? (
        <p className="text-xs text-slate-400">No experience records yet.</p>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{exp.roleTitle}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exp.organization}</p>
              </div>
              <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                {new Date(exp.fromDate).toLocaleDateString('en-IN')} – {exp.toDate ? new Date(exp.toDate).toLocaleDateString('en-IN') : 'Present'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceDetailsPage;
