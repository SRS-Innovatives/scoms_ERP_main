import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, MapPin, Loader2, CheckCircle2, PartyPopper } from 'lucide-react';
import eventService from '../../services/eventService';

export const EventsPage = () => {
  const { success, error: showError } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    eventService.getEvents()
      .then((res) => setEvents(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load events', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleRegister = async (evt) => {
    setRegistering(evt.id);
    try {
      await eventService.register(evt.id);
      success(`Registered for ${evt.title}`, 'Event Registered');
      load();
    } catch (err) {
      showError(err.message || 'Failed to register', 'Registration Failed');
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Campus Events & Symposia" subtitle="Register for cultural activities, sports meets, and technical conferences." />

      {events.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <PartyPopper className="w-8 h-8 text-slate-300" /> No campus events have been published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{evt.title}</h3>
              {evt.description && <p className="text-xs text-slate-500">{evt.description}</p>}
              <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {new Date(evt.eventDate).toLocaleDateString()}
                {evt.venue && <> • <MapPin className="w-3.5 h-3.5 text-rose-500" /> {evt.venue}</>}
              </p>

              {evt.isRegistered ? (
                <button disabled className="w-full py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Registered
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(evt)}
                  disabled={registering === evt.id}
                  className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {registering === evt.id ? 'Registering...' : 'Register For Event'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
