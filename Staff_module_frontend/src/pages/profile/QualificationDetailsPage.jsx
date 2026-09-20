import React, { useState, useEffect } from 'react';
import { Award, Plus, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = { degree: '', institutionName: '', yearOfPassing: '', grade: '' };

export const QualificationDetailsPage = () => {
  const { success, error: showError } = useNotification();
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    profileService.getMyProfile()
      .then((res) => setQualifications(res.data.qualifications || []))
      .catch((err) => { showError(err.message || 'Failed to load qualifications', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await profileService.addQualification(form);
      success('Qualification added successfully!', 'Saved');
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to add qualification', 'Save Failed');
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
          <Award className="w-5 h-5 text-sky-500" /> Academic Qualifications & Degrees
        </h3>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700">
          <Plus className="w-4 h-4" /> Add Qualification
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
          <input required placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input required placeholder="University / Institute" value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input required type="number" placeholder="Year" value={form.yearOfPassing} onChange={(e) => setForm({ ...form, yearOfPassing: e.target.value })} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <div className="flex gap-2">
            <input placeholder="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg" />
            <button type="submit" disabled={submitting} className="px-3 bg-sky-600 text-white rounded-lg font-semibold disabled:opacity-50">{submitting ? '...' : 'Add'}</button>
          </div>
        </form>
      )}

      {qualifications.length === 0 ? (
        <p className="text-xs text-slate-400">No qualifications on record yet.</p>
      ) : (
        <div className="space-y-3">
          {qualifications.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{q.degree}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.institutionName}</p>
              </div>
              <div className="text-right text-xs">
                {q.grade && <span className="font-bold text-sky-600 dark:text-sky-400 block">{q.grade}</span>}
                <span className="text-slate-400">Year: {q.yearOfPassing}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QualificationDetailsPage;
