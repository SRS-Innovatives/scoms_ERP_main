import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const STATUS_LABEL = { PRESENT: 'P', ABSENT: 'A', LATE: 'L', LEAVE: 'LV', ON_DUTY: 'OD', HALF_DAY: 'HD' };
const STATUS_COLOR = { PRESENT: 'text-emerald-600', ABSENT: 'text-rose-600', LATE: 'text-amber-600', LEAVE: 'text-violet-600', ON_DUTY: 'text-sky-600', HALF_DAY: 'text-orange-600' };

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const MonthlyAttendancePage = () => {
  const { error: showError } = useNotification();
  const today = new Date();
  const [mappings, setMappings] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [grid, setGrid] = useState({ days: [], grid: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const loadClasses = useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getMyClasses()
      .then((res) => {
        // de-dupe sections (a teacher may teach multiple subjects in the same section)
        const seen = new Map();
        (res.data || []).forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m); });
        const unique = Array.from(seen.values());
        setMappings(unique);
        if (unique.length > 0) setSelectedSectionId(unique[0].section.id);
      })
      .catch((err) => { showError(err.message || 'Failed to load classes', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (!selectedSectionId) return;
    setLoadingGrid(true);
    attendanceService.getMonthlyGrid(selectedSectionId, month, year)
      .then((res) => setGrid(res.data || { days: [], grid: [] }))
      .catch((err) => showError(err.message || 'Failed to load monthly grid', 'Load Failed'))
      .finally(() => setLoadingGrid(false));
  }, [selectedSectionId, month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadClasses} />;
  }

  const selectedLabel = mappings.find((m) => m.section.id === selectedSectionId);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" /> Monthly Class Attendance Grid
        </h3>

        {mappings.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {mappings.map((m) => (
                <option key={m.section.id} value={m.section.id}>{m.section?.semester?.course?.name} — {m.section?.name}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {MONTH_NAMES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              {[today.getFullYear() - 1, today.getFullYear()].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {mappings.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No assigned classes yet.</p>
      ) : loadingGrid ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : grid.days.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">
          No attendance recorded yet for {selectedLabel?.section?.name} in {MONTH_NAMES[month - 1]} {year}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-2 border border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800">Student</th>
                {grid.days.map((d) => (
                  <th key={d} className="p-1 text-center border border-slate-200 dark:border-slate-700 font-bold">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.grid.map((row) => (
                <tr key={row.studentId} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="p-2 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900">{row.name}</td>
                  {grid.days.map((d) => {
                    const status = row.byDay[d];
                    return (
                      <td key={d} className={`p-1 text-center font-bold ${status ? STATUS_COLOR[status] : 'text-slate-300 dark:text-slate-700'}`}>
                        {status ? STATUS_LABEL[status] : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthlyAttendancePage;
