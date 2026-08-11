import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, MapPin } from 'lucide-react';

export const EventsPage = () => {
  const { success } = useNotification();

  const events = [
    { id: "EVT-101", title: "National Level Tech Symposium - INNOVISION 2026", date: "2026-08-28", venue: "Main Auditorium", organizer: "Dept of Computer Science" },
    { id: "EVT-102", title: "79th Independence Day Cultural Celebration", date: "2026-08-15", venue: "College Grounds", organizer: "Cultural Club" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Campus Events & Symposia" subtitle="Register for cultural activities, sports meets, and technical conferences." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div key={evt.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{evt.title}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> {evt.date} • <MapPin className="w-3.5 h-3.5 text-rose-500" /> {evt.venue}</p>

            <button
              onClick={() => success(`Registered for ${evt.title}`, 'Event Registered')}
              className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Register For Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
