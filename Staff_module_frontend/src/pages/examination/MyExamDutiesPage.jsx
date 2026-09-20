import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { GraduationCap, Calendar, Clock, ClipboardList, Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const MyExamDutiesPage = () => {
  const { error: showError } = useNotification();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    examService.getMySchedules()
      .then((res) => setSchedules(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load exam duties', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Exam Duties</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Exam schedules for subjects you are assigned to teach — enter marks here.</p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No exam duties assigned yet. Duties appear once your Institute Admin schedules an exam for a subject you teach.
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {s.exam?.examType?.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">{s.exam?.name} — {s.subject?.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s._count?.studentMarks ?? 0} marks entered</p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Calendar className="w-4 h-4 text-sky-500" /> {new Date(s.examDate).toLocaleDateString('en-IN')}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-4 h-4 text-amber-500" /> {s.startTime} - {s.endTime}
                </span>
                <button
                  onClick={() => navigate(`/staff/exams/marks-entry?scheduleId=${s.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  <ClipboardList className="w-4 h-4" /> Enter Marks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyExamDutiesPage;
