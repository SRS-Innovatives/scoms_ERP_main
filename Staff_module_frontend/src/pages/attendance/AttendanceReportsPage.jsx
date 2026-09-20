import React, { useEffect, useState, useCallback } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const AttendanceReportsPage = () => {
  const { error: showError } = useNotification();
  const [trend, setTrend] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([attendanceService.getMyClasses(), attendanceService.getHistory()])
      .then(async ([classesRes, historyRes]) => {
        const history = historyRes.data || [];

        // Trend: average attendance % per recorded date, most recent 10 sessions, oldest first
        const trendRows = [...history]
          .slice(0, 10)
          .reverse()
          .map((h) => ({
            label: new Date(h.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
            value: h.totalStudents > 0 ? Math.round((h.presentCount / h.totalStudents) * 100) : 0,
            target: 85,
          }));
        setTrend(trendRows);

        // Defaulters: students with real computed attendancePercent < 75%, across all assigned sections
        const seenSections = new Map();
        (classesRes.data || []).forEach((m) => { if (!seenSections.has(m.section.id)) seenSections.set(m.section.id, m.section); });

        const rosters = await Promise.all(
          Array.from(seenSections.values()).map((section) =>
            attendanceService.getRoster(section.id).then((res) => (res.data || []).map((s) => ({ ...s, sectionName: section.name })))
          )
        );
        const flat = rosters.flat().filter((s) => s.attendancePercent !== null && s.attendancePercent < 75);
        setDefaulters(flat.sort((a, b) => a.attendancePercent - b.attendancePercent));
      })
      .catch((err) => { showError(err.message || 'Failed to load attendance reports', 'Load Failed'); setError(true); })
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
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Analytics & Custom Reports</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Based on the sessions you have actually recorded.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Recent Class Attendance Trend (%)" height={220} data={trend} periodLabel="Last 10 Sessions" />

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Defaulters (&lt;75% Attendance)
            </h4>
          </div>
          {defaulters.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No defaulters found — every student's attendance is 75% or above.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {defaulters.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">{s.sectionName} • Roll {s.rollNumber || s.admissionNumber}</p>
                  </div>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{s.attendancePercent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportsPage;
