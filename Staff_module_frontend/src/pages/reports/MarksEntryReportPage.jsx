import React, { useEffect, useState } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import examService from '../../services/examService';
import ErrorState from '../../components/common/ErrorState';

export const MarksEntryReportPage = () => {
  const { error: showError } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getMySchedules()
      .then((res) => setSchedules(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load marks entry report', 'Load Failed'); setError(true); })
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
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Marks Entry Completion Report</h2>

      {schedules.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-slate-300" /> No exam duties assigned yet.
        </div>
      ) : (
        <div className="overflow-x-auto glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Exam</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Date</th>
                <th className="p-3">Marks Entered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{s.exam?.name}</td>
                  <td className="p-3">{s.subject?.name}</td>
                  <td className="p-3">{new Date(s.examDate).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-sky-600">{s._count?.studentMarks ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarksEntryReportPage;
