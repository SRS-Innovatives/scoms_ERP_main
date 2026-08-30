import React, { useEffect, useState } from 'react';
import StudentTable from '../../components/common/StudentTable';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { AlertCircle, Loader2 } from 'lucide-react';

export const WeakStudentsPage = () => {
  const { error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getStudentPerformance()
      .then((res) => setStudents(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load student performance', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-600" /></div>;
  }

  const weakStudents = students
    .filter((s) => (s.avgMarksPercent !== null && s.avgMarksPercent < 60) || (s.attendancePercent !== null && s.attendancePercent < 75))
    .map((s) => ({ ...s, attendancePercent: s.attendancePercent ?? 0, lastMarks: s.avgMarksPercent ?? '—' }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-5 h-5" />
        <h2 className="text-lg font-bold">Remedial Action Needed - At-Risk / Weak Students</h2>
      </div>
      <p className="text-xs text-slate-500">Students with low attendance (&lt;75%) or low average assessment scores (&lt;60%).</p>

      {weakStudents.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No at-risk students found — everyone is meeting the attendance and marks thresholds (or no data has been recorded yet).
        </div>
      ) : (
        <StudentTable students={weakStudents} />
      )}
    </div>
  );
};

export default WeakStudentsPage;
