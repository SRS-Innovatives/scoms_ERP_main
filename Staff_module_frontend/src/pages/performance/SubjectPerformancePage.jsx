import React, { useEffect, useState } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import examService from '../../services/examService';

export const SubjectPerformancePage = () => {
  const { error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getSubjectPerformance()
      .then((res) => setSubjects(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load subject performance', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
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
