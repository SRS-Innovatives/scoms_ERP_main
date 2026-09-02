import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Loader2, CalendarDays } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import eventService from '../../services/eventService';

export const EventDutiesPage = () => {
  const { error: showError } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getEvents()
      .then((res) => setEvents(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load events', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-amber-500" /> Campus Events Calendar
      </h3>
      <p className="text-xs text-slate-500 -mt-3">
        Upcoming institution events. Duty/role assignment per event is not tracked yet — contact your Institute Admin for coordination duties.
      </p>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500">No campus events have been published yet.</div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{e.title}</h4>
                {e.venue && <p className="text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {e.venue}</p>}
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {new Date(e.eventDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventDutiesPage;
