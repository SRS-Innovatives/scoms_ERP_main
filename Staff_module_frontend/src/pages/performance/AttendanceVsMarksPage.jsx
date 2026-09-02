import React, { useEffect, useState } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';

export const AttendanceVsMarksPage = () => {
  const { error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getStudentPerformance()
      .then((res) => setStudents(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load performance data', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  const both = students.filter((s) => s.attendancePercent !== null && s.avgMarksPercent !== null);
  const attendanceData = both.map((s) => ({ label: s.rollNo, value: s.attendancePercent }));
  const marksData = both.map((s) => ({ label: s.rollNo, value: s.avgMarksPercent }));

  const correlationNote = (() => {
    if (both.length < 2) return null;
    const avgAtt = both.reduce((sum, s) => sum + s.attendancePercent, 0) / both.length;
    const avgMarks = both.reduce((sum, s) => sum + s.avgMarksPercent, 0) / both.length;
    const highAttHighMarks = both.filter((s) => s.attendancePercent >= avgAtt && s.avgMarksPercent >= avgMarks).length;
    const lowAttLowMarks = both.filter((s) => s.attendancePercent < avgAtt && s.avgMarksPercent < avgMarks).length;
    const alignedPct = Math.round(((highAttHighMarks + lowAttLowMarks) / both.length) * 100);
    return `${alignedPct}% of students follow the expected pattern (attendance and marks move together, relative to class averages).`;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Correlation: Attendance Rate vs Assessment Marks</h2>
        {correlationNote && <p className="text-xs text-slate-500 mt-1">{correlationNote}</p>}
      </div>

      {both.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Not enough recorded attendance and marks data yet to compute a correlation.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart title="Attendance % by Student (Roll No.)" height={240} data={attendanceData} periodLabel="All Sessions" />
          <PerformanceChart title="Average Marks % by Student (Roll No.)" height={240} data={marksData} periodLabel="All Exams" />
        </div>
      )}
    </div>
  );
};

export default AttendanceVsMarksPage;
