import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };

export const WeeklyTimetablePage = () => {
  const { error: showError } = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    timetableService.getMyTimetable()
      .then((res) => setEntries(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load timetable', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const maxPeriod = Math.max(1, ...entries.map((e) => e.period));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const cellFor = (day, period) => entries.find((e) => e.dayOfWeek === day && e.period === period);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-500" /> Weekly Master Teaching Schedule
        </h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-10">No timetable slots assigned to you yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-200 dark:border-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-3 border border-slate-200 dark:border-slate-700">Period</th>
                {DAYS.map((d) => <th key={d} className="p-3 border border-slate-200 dark:border-slate-700">{DAY_LABELS[d]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold">
              {periods.map((p) => (
                <tr key={p} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold">P{p}</td>
                  {DAYS.map((d) => {
                    const e = cellFor(d, p);
                    return (
                      <td key={d} className="p-3 border border-slate-200 dark:border-slate-700">
                        {e ? (
                          <div>
                            <p>{e.subject?.name || '—'}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{e.timetable?.section?.name}</p>
                          </div>
                        ) : '—'}
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

export default WeeklyTimetablePage;
