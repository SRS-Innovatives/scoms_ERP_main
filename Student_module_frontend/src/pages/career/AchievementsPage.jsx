import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Award, Trophy, Loader2, Plus, X } from 'lucide-react';
import achievementService from '../../services/achievementService';
import ErrorState from '../../components/common/ErrorState';

const CATEGORY_OPTIONS = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'TECHNICAL', label: 'Technical / Hackathon' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = { title: '', description: '', category: 'OTHER', awardedDate: '' };

export const AchievementsPage = () => {
  const { success, error: showError } = useNotification();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    achievementService.getMyAchievements()
      .then((res) => setAchievements(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load achievements', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await achievementService.addAchievement(form);
      success(`"${form.title}" added to your portfolio.`, 'Achievement Added');
      setForm(emptyForm);
      setFormOpen(false);
      load();
    } catch (err) {
      showError(err.message || 'Failed to add achievement', 'Add Failed');
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
      <PageHeader title="Student Achievements Portfolio" subtitle="Extracurricular awards, hackathon certificates, and sports medals." />

      <button
        onClick={() => setFormOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
      >
        {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {formOpen ? 'Cancel' : 'Add Achievement'}
      </button>

      {formOpen && (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs max-w-xl">
          <input required placeholder="Title (e.g. First Prize - IIT Madras Hackathon 2026)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
          <textarea rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"></textarea>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl">
              {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input required type="date" value={form.awardedDate} onChange={(e) => setForm({ ...form, awardedDate: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add to Portfolio'}
          </button>
        </form>
      )}

      {achievements.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Award className="w-8 h-8 text-slate-300" /> No achievements added yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((a) => (
            <div key={a.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{a.title}</h3>
                  {a.description && <p className="text-slate-500">{a.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{CATEGORY_OPTIONS.find((c) => c.value === a.category)?.label} • {new Date(a.awardedDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
