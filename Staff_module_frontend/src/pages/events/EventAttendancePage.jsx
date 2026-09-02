import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Save, Loader2 } from 'lucide-react';
import eventService from '../../services/eventService';
import { useNotification } from '../../context/NotificationContext';

export const EventAttendancePage = () => {
  const { success, error: showError } = useNotification();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [attendedMap, setAttendedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventService.getEvents()
      .then((res) => {
        const list = res.data || [];
        setEvents(list);
        if (list.length > 0) setEventId(list[0].id);
      })
      .catch((err) => showError(err.message || 'Failed to load events', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    if (!eventId) return;
    setLoadingRegs(true);
    eventService.getRegistrations(eventId)
      .then((res) => {
        const regs = res.data?.registrations || [];
        setRegistrations(regs);
        const map = {};
        regs.forEach((r) => { map[r.id] = r.attended; });
        setAttendedMap(map);
      })
      .catch((err) => showError(err.message || 'Failed to load registrations', 'Load Failed'))
      .finally(() => setLoadingRegs(false));
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = registrations.map((r) => ({ registrationId: r.id, attended: !!attendedMap[r.id] }));
      await eventService.markAttendance(eventId, records);
      success('Event attendance saved successfully.', 'Attendance Saved');
    } catch (err) {
      showError(err.message || 'Failed to save attendance', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        No events have been scheduled yet.
      </div>
    );
  }

  const presentCount = registrations.filter((r) => attendedMap[r.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Co-Curricular & Club Attendance Marker</h2>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.eventDate).toLocaleDateString()}) — {ev._count?.registrations ?? 0} registered</option>
          ))}
        </select>
      </div>

      {loadingRegs ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : registrations.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No students have registered for this event yet.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500">
              Present: <span className="font-bold text-emerald-600">{presentCount}</span> / {registrations.length} registered
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Attendance
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {registrations.map((r) => (
              <button
                key={r.id}
                onClick={() => setAttendedMap((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {r.student?.firstName} {r.student?.lastName} — {r.student?.section?.name} (Roll {r.student?.rollNumber})
                </span>
                {attendedMap[r.id] ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> Present</span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400"><Circle className="w-4 h-4" /> Absent</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendancePage;
