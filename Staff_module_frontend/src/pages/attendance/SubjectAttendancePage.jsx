import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';

export const SubjectAttendancePage = () => {
  const { error: showError } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([attendanceService.getMyClasses(), attendanceService.getHistory()])
      .then(([classesRes, historyRes]) => {
        const mappings = classesRes.data || [];
        const history = historyRes.data || [];

        const computed = mappings.map((m) => {
          const sessions = history.filter((h) => h.section === m.section?.name && h.subject === m.subject?.name);
          const totalStudents = sessions.reduce((sum, s) => sum + s.totalStudents, 0);
          const totalPresent = sessions.reduce((sum, s) => sum + s.presentCount, 0);
          const avgPercent = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : null;
          return {
            id: m.id,
            name: `${m.section?.semester?.course?.name || ''} — ${m.section?.name} (${m.subject?.name})`,
            sessionsConducted: sessions.length,
            avgPercent,
          };
        });
        setRows(computed);
      })
      .catch((err) => showError(err.message || 'Failed to load subject attendance stats', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Subject-wise Attendance Statistics
      </h3>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No assigned classes yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sessions Conducted: {r.sessionsConducted}</p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {r.avgPercent !== null ? `${r.avgPercent}%` : 'No data'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectAttendancePage;
