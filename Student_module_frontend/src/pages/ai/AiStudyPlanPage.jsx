import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Sparkles, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import examService from '../../services/examService';
import aiService from '../../services/aiService';
import ErrorState from '../../components/common/ErrorState';

export const AiStudyPlanPage = () => {
  const { error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);

  const loadSubjects = () => {
    setLoading(true);
    setError(false);
    Promise.all([studentService.getMySubjects(), attendanceService.getAttendance(), examService.getResults()])
      .then(([subjectsRes, attendanceRes, resultsRes]) => {
        const attendanceBySubject = {};
        (attendanceRes.data?.subjectBreakdown || []).forEach((s) => { attendanceBySubject[s.subject] = s.percentage; });

        const marksBySubject = {};
        (resultsRes.data || []).forEach((m) => {
          const name = m.examSchedule?.subject?.name;
          if (!name) return;
          if (!marksBySubject[name]) marksBySubject[name] = { obtained: 0, max: 0 };
          marksBySubject[name].obtained += m.marksObtained;
          marksBySubject[name].max += m.examSchedule.maxMarks;
        });

        const merged = (subjectsRes.data || []).map((s) => {
          const attendance = attendanceBySubject[s.name] ?? null;
          const marksData = marksBySubject[s.name];
          const marksPercent = marksData ? Math.round((marksData.obtained / marksData.max) * 100) : null;
          return { ...s, attendance, marksPercent };
        });

        setSubjects(merged);
      })
      .catch((err) => { showError(err.message || 'Failed to load subject performance', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(loadSubjects, []); // eslint-disable-line react-hooks/exhaustive-deps

  const weakSubjects = subjects.filter((s) => (s.attendance !== null && s.attendance < 75) || (s.marksPercent !== null && s.marksPercent < 60));
  const strongSubjects = subjects.filter((s) => (s.marksPercent !== null && s.marksPercent >= 85));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const focusList = weakSubjects.length > 0
        ? weakSubjects.map((s) => `${s.name} (attendance: ${s.attendance ?? 'n/a'}%, marks: ${s.marksPercent ?? 'n/a'}%)`).join('; ')
        : subjects.map((s) => s.name).join(', ');
      const prompt = `Suggest a focused revision plan for a student. Priority subjects based on real performance: ${focusList || 'no subject data yet'}.`;
      const res = await aiService.askAiAssistant(prompt, focusList);
      setPlan(res.data);
    } catch (err) {
      showError(err.message || 'Failed to generate study plan', 'Generation Failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadSubjects} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Study & Revision Planner" subtitle="Built from your real attendance and marks data — not a fixed template." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-rose-200 dark:border-rose-900 space-y-3">
          <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Subjects Needing Attention
          </h3>
          {weakSubjects.length === 0 ? (
            <p className="text-xs text-slate-400">No subjects currently below the attendance/marks thresholds — nice work.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {weakSubjects.map((s) => (
                <div key={s.id} className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {s.attendance !== null && s.attendance < 75 ? `${s.attendance}% attendance` : `${s.marksPercent}% marks`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900 space-y-3">
          <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Strong Subjects (≥85%)</h3>
          {strongSubjects.length === 0 ? (
            <p className="text-xs text-slate-400">No subjects have reached 85% yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {strongSubjects.map((s) => (
                <div key={s.id} className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.marksPercent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Generated Revision Plan
          </h3>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {plan ? 'Regenerate' : 'Generate Plan'}
          </button>
        </div>

        {plan ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{plan.answer}</p>
        ) : (
          <p className="text-xs text-slate-400">Click "Generate Plan" to get a revision plan based on the subjects above.</p>
        )}
      </div>
    </div>
  );
};

export default AiStudyPlanPage;
