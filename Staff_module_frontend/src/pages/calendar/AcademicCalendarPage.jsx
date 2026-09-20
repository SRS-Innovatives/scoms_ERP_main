import React, { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import academicCalendarService from '../../services/academicCalendarService';

const TYPE_STYLES = {
  HOLIDAY: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400',
  EXAM: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  EVENT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400',
  DEADLINE: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400',
  OTHER: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export const AcademicCalendarPage = () => {
  const { error: showError } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    academicCalendarService.getEvents()
      .then((res) => setEvents(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load academic calendar', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sky-500" /> Academic Calendar
        </h3>
        <p className="text-xs text-slate-500 mt-1">Holidays, exam windows, events and deadlines set by your Institute Admin</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : events.length === 0 ? (
        <EmptyState title="No Events Yet" message="Your Institute Admin hasn't published any calendar events yet." icon={CalendarDays} />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{e.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLES[e.eventType] || TYPE_STYLES.OTHER}`}>{e.eventType}</span>
                </div>
                {e.description && <p className="text-slate-500">{e.description}</p>}
              </div>
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {new Date(e.startDate).toLocaleDateString()}
                {e.endDate ? ` – ${new Date(e.endDate).toLocaleDateString()}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicCalendarPage;
