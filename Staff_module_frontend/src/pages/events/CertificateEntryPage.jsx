import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Award, Save, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import achievementService from '../../services/achievementService';
import ErrorState from '../../components/common/ErrorState';

const CATEGORIES = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'TECHNICAL', 'OTHER'];

export const CertificateEntryPage = () => {
  const { success, error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [awardedDate, setAwardedDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const load = () => {
    setError(false);
    Promise.all([attendanceService.getMyClasses(), achievementService.getAll()])
      .then(async ([classesRes, achievementsRes]) => {
        const mappings = classesRes.data || [];
        const seen = new Map();
        mappings.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m.section); });
        const rosters = await Promise.all(
          Array.from(seen.values()).map((section) =>
            attendanceService.getRoster(section.id).then((res) => (res.data || []).map((s) => ({ ...s, sectionName: section.name })))
          )
        );
        const flat = rosters.flat();
        const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
        setStudents(unique);
        if (unique.length > 0) setStudentId((prev) => prev || unique[0].id);
        setAchievements(achievementsRes.data || []);
      })
      .catch((err) => { showError(err.message || 'Failed to load data', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !title.trim()) return;
    setSaving(true);
    try {
      await achievementService.create({ studentId, title, description, category, awardedDate });
      const student = students.find((s) => s.id === studentId);
      success(`Achievement recorded for ${student?.firstName} ${student?.lastName}!`, 'Certificate Issued');
      setTitle('');
      setDescription('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to record achievement', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (students.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        You have no assigned classes yet. Ask your Institute Admin to assign you to a subject/section first.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Event Achievement & Certificate Entry
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.sectionName} (Roll {s.rollNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Event / Competition / Achievement</label>
              <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. State Physics Olympiad 2026 — 1st Rank" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Awarded</label>
            <input required type="date" value={awardedDate} onChange={(e) => setAwardedDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Record Achievement'}
            </button>
          </div>
        </form>
      </div>

      {achievements.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            Previously Recorded Achievements
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
            {achievements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{a.title}</span>
                  <span className="text-slate-400">{new Date(a.awardedDate).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {a.student?.firstName} {a.student?.lastName} ({a.student?.section?.name}) • {a.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateEntryPage;
