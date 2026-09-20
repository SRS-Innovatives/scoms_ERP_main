import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Printer, Loader2, Save } from 'lucide-react';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import resumeService from '../../services/resumeService';
import ErrorState from '../../components/common/ErrorState';

export const ResumeBuilderPage = () => {
  const { success, error: showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([studentService.getProfile(), examService.getResults(), resumeService.getMyResume()])
      .then(([profileRes, resultsRes, resumeRes]) => {
        setProfile(profileRes.data);
        setResults(resultsRes.data || []);
        setSummary(resumeRes.data?.summary || '');
        setSkills((resumeRes.data?.skills || []).join(', '));
        setProjects((resumeRes.data?.projects || []).join(', '));
      })
      .catch((err) => { showError(err.message || 'Failed to load resume data', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const gpa = useMemo(() => {
    if (results.length === 0) return null;
    const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = results.reduce((sum, r) => sum + r.examSchedule.maxMarks, 0);
    if (totalMax === 0) return null;
    return ((totalObtained / totalMax) * 10).toFixed(2);
  }, [results]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await resumeService.updateMyResume({
        summary,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        projects: projects.split(',').map((p) => p.trim()).filter(Boolean),
      });
      success('Resume saved successfully.', 'Resume Saved');
    } catch (err) {
      showError(err.message || 'Failed to save resume', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader title="ATS Resume Builder" subtitle="Build your placement resume from your real academic record." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm">Customize Resume Sections</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Professional Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short summary of your strengths and goals..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            ></textarea>
          </div>
          <FormInput label="Technical Skills (comma separated)" value={skills} onChange={setSkills} />
          <FormInput label="Academic Projects (comma separated)" value={projects} onChange={setProjects} />

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Resume'}
            </button>
            <button type="button" onClick={() => window.print()} className="px-4 py-3 font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </form>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 text-xs">
          <h3 className="font-bold text-sm text-center border-b pb-2">{fullName}</h3>
          <p className="text-center text-slate-500 text-[11px]">{profile.email} • {profile.phone} • {profile.city || 'City not set'}</p>

          {summary && (
            <div className="border-t pt-2 space-y-1">
              <h4 className="font-bold uppercase text-[10px] text-indigo-600">Summary</h4>
              <p>{summary}</p>
            </div>
          )}

          <div className="border-t pt-2 space-y-1">
            <h4 className="font-bold uppercase text-[10px] text-indigo-600">Education</h4>
            <p className="font-bold">{profile.course?.name} - {profile.institution?.name}</p>
            <p className="text-slate-500">GPA: {gpa || '—'} / 10.0</p>
          </div>

          {skills && (
            <div className="border-t pt-2 space-y-1">
              <h4 className="font-bold uppercase text-[10px] text-indigo-600">Skills</h4>
              <p>{skills}</p>
            </div>
          )}

          {projects && (
            <div className="border-t pt-2 space-y-1">
              <h4 className="font-bold uppercase text-[10px] text-indigo-600">Projects</h4>
              <p>{projects}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
