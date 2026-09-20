import React, { useEffect, useState, useCallback } from 'react';
import StudentTable from '../../components/common/StudentTable';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Award, Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const TopPerformersPage = () => {
  const { error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getStudentPerformance()
      .then((res) => setStudents(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load student performance', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const toppers = students
    .filter((s) => s.avgMarksPercent !== null && s.avgMarksPercent >= 85)
    .sort((a, b) => b.avgMarksPercent - a.avgMarksPercent)
    .map((s) => ({ ...s, attendancePercent: s.attendancePercent ?? 0, lastMarks: s.avgMarksPercent }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Award className="w-5 h-5" />
        <h2 className="text-lg font-bold">Class Rankers & Top Performers</h2>
      </div>
      <p className="text-xs text-slate-500">Students averaging 85% or above across your recorded assessments.</p>

      {toppers.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No students have reached 85% average yet — this will populate as marks are entered.
        </div>
      ) : (
        <StudentTable students={toppers} />
      )}
    </div>
  );
};

export default TopPerformersPage;
