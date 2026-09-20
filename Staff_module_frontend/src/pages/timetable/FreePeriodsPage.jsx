import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIOD_TIMES = { 1: ['08:45', '09:40'], 2: ['09:40', '10:35'], 3: ['10:45', '11:40'], 4: ['11:40', '12:35'], 5: ['13:30', '14:25'], 6: ['14:25', '15:20'], 7: ['15:20', '16:15'] };

export const FreePeriodsPage = () => {
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

  const today = DAY_NAMES[new Date().getDay()];
  const busyPeriods = new Set(entries.filter((e) => e.dayOfWeek === today).map((e) => e.period));
  const freePeriods = Object.keys(PERIOD_TIMES)
    .map(Number)
    .filter((p) => !busyPeriods.has(p));

  const isWeekend = today === 'SUNDAY';

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-500" /> Free & Non-Teaching Periods Today
      </h3>
      {isWeekend ? (
        <p className="text-xs text-slate-500 text-center py-6">No scheduled periods today.</p>
      ) : freePeriods.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">You have classes in every period today — no free periods.</p>
      ) : (
        <div className="space-y-2 text-xs">
          {freePeriods.map((p) => (
            <div key={p} className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex justify-between font-semibold">
              <span>Period {p} ({PERIOD_TIMES[p][0]} - {PERIOD_TIMES[p][1]})</span>
              <span className="text-emerald-700 dark:text-emerald-400">Free</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreePeriodsPage;
