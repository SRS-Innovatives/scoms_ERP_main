import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, XCircle, CalendarCheck2, Loader2, Inbox } from 'lucide-react';
import appointmentService from '../../services/appointmentService';

export const AppointmentRequestsPage = () => {
  const { success, error: showError } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    appointmentService.getMyAppointments()
      .then((res) => setAppointments(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load appointments', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleDecision = async (appt, status) => {
    setActing(appt.id);
    try {
      await appointmentService.updateStatus(appt.id, status);
      success(`Appointment ${status.toLowerCase()}.`, 'Appointment Updated');
      load();
    } catch (err) {
      showError(err.message || 'Failed to update appointment', 'Update Failed');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <CalendarCheck2 className="w-5 h-5 text-sky-500" /> Student Appointment Requests
      </h3>

      {appointments.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
          <Inbox className="w-8 h-8 text-slate-300" /> No appointment requests yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{a.student?.firstName} {a.student?.lastName} <span className="text-slate-400 font-normal">#{a.student?.rollNumber}</span></td>
                  <td className="p-3 text-slate-500">{new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}</td>
                  <td className="p-3 max-w-[220px] truncate">{a.purpose || '—'}</td>
                  <td className="p-3"><StatusBadge status={a.status} size="sm" /></td>
                  <td className="p-3 text-right">
                    {a.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleDecision(a, 'APPROVED')} disabled={acting === a.id} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg disabled:opacity-50" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDecision(a, 'REJECTED')} disabled={acting === a.id} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-50" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : a.status === 'APPROVED' ? (
                      <button onClick={() => handleDecision(a, 'COMPLETED')} disabled={acting === a.id} className="px-2.5 py-1 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg disabled:opacity-50">
                        Mark Completed
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestsPage;
