import React, { useEffect, useState } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Loader2, ClipboardX } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import attendanceService from '../../services/attendanceService';
import ErrorState from '../../components/common/ErrorState';

export const AttendanceReportPage = () => {
  const { error: showError } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getHistory()
      .then((res) => setSessions(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load attendance report', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const chartData = sessions
    .slice(0, 10)
    .reverse()
    .map((s) => ({
      label: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: s.totalStudents > 0 ? Math.round((s.presentCount / s.totalStudents) * 100) : 0,
      target: 100,
    }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Taken Master Report</h2>

      {sessions.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ClipboardX className="w-8 h-8 text-slate-300" /> No attendance has been recorded yet.
        </div>
      ) : (
        <>
          <PerformanceChart title="Last 10 Sessions — Present %" height={220} data={chartData} />

          <div className="overflow-x-auto glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Present</th>
                  <th className="p-3">Absent</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="p-3">{s.section}</td>
                    <td className="p-3">{s.subject}</td>
                    <td className="p-3 font-bold text-emerald-600">{s.presentCount}</td>
                    <td className="p-3 font-bold text-rose-600">{s.absentCount}</td>
                    <td className="p-3">{s.totalStudents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReportPage;
