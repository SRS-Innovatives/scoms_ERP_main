import React, { useEffect, useState, useCallback } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import examService from '../../services/examService';
import ErrorState from '../../components/common/ErrorState';

export const SubjectPerformancePage = () => {
  const { error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getSubjectPerformance()
      .then((res) => setSubjects(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load subject performance', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const graded = subjects.filter((s) => s.avgPercentage !== null);
  const chartData = graded.map((s) => ({
    label: `${s.subjectName} (${s.courseName})`,
    value: s.avgPercentage,
    target: 100,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Subject-wise Class Performance Comparison</h2>

      {subjects.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          You aren't assigned to teach any subject yet.
        </div>
      ) : graded.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No marks have been entered yet for your subjects — this chart will populate once exams are graded.
        </div>
      ) : (
        <PerformanceChart title="Average Marks % Across Your Subjects" height={240} data={chartData} />
      )}
    </div>
  );
};

export default SubjectPerformancePage;
