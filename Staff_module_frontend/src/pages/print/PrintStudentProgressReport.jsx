import React, { useEffect, useState, useCallback } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import attendanceService from '../../services/attendanceService';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const PrintStudentProgressReport = () => {
  const { error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getMyClasses()
      .then(async (res) => {
        const mappings = res.data || [];
        const seen = new Map();
        mappings.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m.section); });
        const rosters = await Promise.all(
          Array.from(seen.values()).map((section) =>
            attendanceService.getRoster(section.id).then((r) => (r.data || []).map((s) => ({ ...s, sectionName: section.name })))
          )
        );
        const flat = rosters.flat();
        const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
        setStudents(unique);
        if (unique.length > 0) setStudentId(unique[0].id);
      })
      .catch((err) => { showError(err.message || 'Failed to load students', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!studentId) return;
    setLoadingRows(true);
    examService.getMySchedules()
      .then(async (res) => {
        const schedules = res.data || [];
        const rosters = await Promise.all(schedules.map((s) => examService.getRoster(s.id)));
        const built = schedules.map((s, idx) => {
          const entry = (rosters[idx].data?.roster || []).find((r) => r.id === studentId);
          return {
            subject: s.subject?.name,
            examName: s.exam?.name,
            maxMarks: s.maxMarks,
            marksObtained: entry?.mark?.marksObtained ?? null,
            grade: entry?.mark?.grade ?? null,
          };
        }).filter((r) => r.marksObtained !== null);
        setRows(built);
      })
      .catch((err) => showError(err.message || 'Failed to load marks', 'Load Failed'))
      .finally(() => setLoadingRows(false));
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (students.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no assigned classes yet.
      </div>
    );
  }

  const student = students.find((s) => s.id === studentId);

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.sectionName}</option>)}
        </select>
      </div>

      {loadingRows ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : (
        <PrintLayout title="STUDENT ACADEMIC REPORT CARD" documentNo={`RC-${studentId.slice(0, 8).toUpperCase()}`}>
          <div className="text-xs space-y-4">
            <div className="p-3 bg-slate-100 rounded-lg space-y-1 border border-slate-300">
              <p><span className="font-bold">Student Name:</span> {student?.firstName} {student?.lastName}</p>
              <p><span className="font-bold">Roll Number:</span> {student?.rollNumber} | <span className="font-bold">Class:</span> {student?.sectionName}</p>
            </div>

            {rows.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No marks recorded yet for this student in your exam duties.</p>
            ) : (
              <table className="w-full text-left border border-slate-400">
                <thead className="bg-slate-200 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-400">Exam</th>
                    <th className="p-2 border border-slate-400">Subject</th>
                    <th className="p-2 border border-slate-400">Max Marks</th>
                    <th className="p-2 border border-slate-400">Obtained</th>
                    <th className="p-2 border border-slate-400">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border border-slate-300">{r.examName}</td>
                      <td className="p-2 border border-slate-300 font-bold">{r.subject}</td>
                      <td className="p-2 border border-slate-300">{r.maxMarks}</td>
                      <td className="p-2 border border-slate-300 font-bold">{r.marksObtained}</td>
                      <td className="p-2 border border-slate-300 font-bold">{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default PrintStudentProgressReport;
