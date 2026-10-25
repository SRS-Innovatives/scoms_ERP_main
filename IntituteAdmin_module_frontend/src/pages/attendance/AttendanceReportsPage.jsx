import React, { useState, useEffect } from 'react';
import ChartCard from '../../components/common/ChartCard';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export const AttendanceReportsPage = () => {
  const { notifyError } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getReports(14)
      .then((res) => setData(res.data))
      .catch((error) => notifyError(`Failed to load attendance reports: ${error.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const chartData = (data?.trend || []).map((d) => ({ day: d.date.slice(5), rate: d.rate }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Institution-wide attendance rate over the last 14 days</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Overall Attendance Rate (14d)</p>
          <p className="text-2xl font-bold text-emerald-600">{data?.overallRate ?? 0}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Total Attendance Records</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.overallTotal ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Days With Sessions Recorded</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.trend?.length ?? 0}</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          No attendance sessions recorded in the last 14 days yet.
        </div>
      ) : (
        <ChartCard title="Daily Attendance Rate Trend" subtitle="Across all sections, last 14 days" type="line" data={chartData} />
      )}
    </div>
  );
};

export default AttendanceReportsPage;
