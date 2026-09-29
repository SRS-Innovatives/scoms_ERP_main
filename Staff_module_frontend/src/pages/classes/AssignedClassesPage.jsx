import React, { useEffect, useState, useCallback } from 'react';
import { Users, BookOpen, ChevronRight, Loader2, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import attendanceService from '../../services/attendanceService';
import ErrorState from '../../components/common/ErrorState';

export const AssignedClassesPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getMyClasses()
      .then((res) => setMappings(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load assigned classes', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Assigned Classes & Subjects</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sections and subjects your Institute Admin has assigned you to teach.</p>
        </div>
      </div>

      {mappings.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <LayoutGrid className="w-8 h-8 text-slate-300" /> No classes assigned yet. Ask your Institute Admin to assign you a subject and section.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mappings.map((m) => (
            <div key={m.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    {m.section?.name}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">{m.section?.semester?.course?.name}</h3>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-500" /> Subject: {m.subject?.name}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> {m.section?._count?.students ?? 0} Enrolled Students
                </span>
                <span>{m.section?.semester?.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/staff/attendance/take')}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <span>Take Attendance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('/staff/materials/upload')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Share Material
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedClassesPage;
