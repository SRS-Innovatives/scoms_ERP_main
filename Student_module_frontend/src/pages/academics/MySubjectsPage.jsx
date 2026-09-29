import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { User, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import examService from '../../services/examService';
import ErrorState from '../../components/common/ErrorState';

export const MySubjectsPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
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

        const merged = (subjectsRes.data || []).map((s) => ({
          ...s,
          attendance: attendanceBySubject[s.name] ?? null,
          marks: marksBySubject[s.name] || null,
        }));

        setSubjects(merged);
      })
      .catch((err) => { showError(err.message || 'Failed to load subjects', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Enrolled Academic Subjects" subtitle="Your course roster with real-time attendance and marks." />

      {subjects.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <BookOpen className="w-8 h-8 text-slate-300" /> No subjects set up for your course yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/student/subjects/${sub.id}`)}
              className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                  {sub.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{sub.type}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" /> Faculty: <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.faculty}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-800 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Credits</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{sub.credits}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
                  <p className={`font-bold ${sub.attendance === null ? 'text-slate-400' : sub.attendance < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {sub.attendance === null ? '—' : `${sub.attendance}%`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Marks</p>
                  <p className="font-bold text-indigo-600">
                    {sub.marks ? `${sub.marks.obtained} / ${sub.marks.max}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubjectsPage;
