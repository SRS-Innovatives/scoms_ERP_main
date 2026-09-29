import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Globe, Loader2 } from 'lucide-react';
import examService from '../../services/examService';

export const ResultPublishPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    examService.getExams()
      .then((res) => {
        setExams(res.data || []);
        if ((res.data || []).length > 0) setExamId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load exams: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  const fetchSchedules = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await examService.getSchedules(examId);
      setSchedules(res.data || []);
    } catch (error) {
      notifyError(`Failed to load schedules: ${error.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [examId, notifyError]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleTogglePublish = async (scheduleId) => {
    setBusyId(scheduleId);
    try {
      const res = await examService.publishResults(scheduleId);
      notifySuccess(res.data.isPublished ? 'Results published — visible to students now!' : 'Results unpublished.');
      fetchSchedules();
    } catch (error) {
      notifyError(`Failed to update publish status: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Exam Result Publication Console</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Publish or unpublish per-subject results — students only see marks after publishing</p>
      </div>

      <FormSection title="Select Exam" icon={Globe}>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </FormSection>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchSchedules} />
      ) : schedules.length === 0 ? (
        <EmptyState title="No Subject Schedules" message="Add subject schedules under Exam Schedule first." />
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${s.isPublished ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}
            >
              <div>
                <p className={`font-bold ${s.isPublished ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                  {s.subject?.name} — {s._count?.studentMarks ?? 0} marks entered
                </p>
                <p className={`text-xs mt-0.5 ${s.isPublished ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {s.isPublished ? `Published on ${new Date(s.publishedAt).toLocaleString('en-IN')}. Visible on Student Portal.` : 'Not published — hidden from students.'}
                </p>
              </div>
              <button
                onClick={() => handleTogglePublish(s.id)}
                disabled={busyId === s.id}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {busyId === s.id ? 'Working...' : s.isPublished ? 'Unpublish' : 'Publish Live'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultPublishPage;
