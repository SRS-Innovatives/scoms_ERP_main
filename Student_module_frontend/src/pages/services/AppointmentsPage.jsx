import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, CalendarPlus, Inbox } from 'lucide-react';
import appointmentService from '../../services/appointmentService';

export const AppointmentsPage = () => {
  const { success, error: showError } = useNotification();
  const [teachers, setTeachers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ staffId: '', slotDate: '', slotTime: '', purpose: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([appointmentService.getTeachers(), appointmentService.getMyAppointments()])
      .then(([teachersRes, appointmentsRes]) => {
        const t = teachersRes.data || [];
        setTeachers(t);
        setAppointments(appointmentsRes.data || []);
        if (t.length > 0) setForm((prev) => ({ ...prev, staffId: prev.staffId || t[0].id }));
      })
      .catch((err) => showError(err.message || 'Failed to load appointments', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentService.bookAppointment(form);
      success('Appointment slot requested.', 'Slot Requested');
      setForm((prev) => ({ ...prev, slotDate: '', slotTime: '', purpose: '' }));
      load();
    } catch (err) {
      showError(err.message || 'Failed to book appointment', 'Booking Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Counselling & Faculty Mentorship Appointments" subtitle="Request a 1-on-1 slot with a teacher who teaches your section." />

      {teachers.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No teachers assigned to your section yet.
        </div>
      ) : (
        <form onSubmit={handleBook} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs max-w-xl">
          <h3 className="font-bold text-sm">Book an Appointment</h3>
          <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl">
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.designation}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" required value={form.slotDate} onChange={(e) => setForm({ ...form, slotDate: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
            <input type="time" required value={form.slotTime} onChange={(e) => setForm({ ...form, slotTime: e.target.value })} className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
          </div>
          <textarea rows={2} placeholder="Purpose (optional)" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"></textarea>
          <button type="submit" disabled={submitting} className="w-full py-2.5 font-bold text-white bg-indigo-600 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50">
            <CalendarPlus className="w-4 h-4" /> {submitting ? 'Requesting...' : 'Request Slot'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase">My Appointments</h4>
        {appointments.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <Inbox className="w-7 h-7 text-slate-300" /> No appointments requested yet.
          </div>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{a.staff?.firstName} {a.staff?.lastName} ({a.staff?.designation})</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}{a.purpose ? ` • ${a.purpose}` : ''}</p>
              </div>
              <StatusBadge status={a.status} size="sm" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
