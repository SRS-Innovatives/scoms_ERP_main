import React, { useEffect, useState } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import StudentTable from '../../components/common/StudentTable';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';

const BANDS = [
  { label: '<60%', test: (v) => v < 60 },
  { label: '60-75%', test: (v) => v >= 60 && v < 75 },
  { label: '75-90%', test: (v) => v >= 75 && v < 90 },
  { label: '90%+', test: (v) => v >= 90 },
];

export const StudentProgressPage = () => {
  const { error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getStudentPerformance()
      .then((res) => setStudents(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load student progress', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  const withMarks = students.filter((s) => s.avgMarksPercent !== null);
  const withAttendance = students.filter((s) => s.attendancePercent !== null);

  const marksBandData = BANDS.map((b) => ({
    label: b.label,
    value: withMarks.length > 0 ? Math.round((withMarks.filter((s) => b.test(s.avgMarksPercent)).length / withMarks.length) * 100) : 0,
  }));
  const attendanceBandData = BANDS.map((b) => ({
    label: b.label,
    value: withAttendance.length > 0 ? Math.round((withAttendance.filter((s) => b.test(s.attendancePercent)).length / withAttendance.length) * 100) : 0,
  }));

  const tableStudents = students.map((s) => ({ ...s, attendancePercent: s.attendancePercent ?? 0, lastMarks: s.avgMarksPercent ?? '—' }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student Academic Progress Tracker</h2>
        <p className="text-xs text-slate-500">Real attendance and marks data across your assigned classes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Marks Distribution (% of students per band)" height={200} data={marksBandData} periodLabel="All Exams" />
        <PerformanceChart title="Attendance Distribution (% of students per band)" height={200} data={attendanceBandData} periodLabel="All Sessions" />
      </div>

      {students.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No assigned classes yet.
        </div>
      ) : (
        <StudentTable students={tableStudents} />
      )}
    </div>
  );
};

export default StudentProgressPage;
