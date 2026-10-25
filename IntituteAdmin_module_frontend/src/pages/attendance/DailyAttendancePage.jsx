import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Check, X, Clock, Loader2, Calendar } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

const STATUS_META = {
  PRESENT: { icon: Check, className: 'bg-emerald-100 text-emerald-700' },
  LATE: { icon: Clock, className: 'bg-amber-100 text-amber-700' },
  ABSENT: { icon: X, className: 'bg-rose-100 text-rose-700' },
  LEAVE: { icon: Clock, className: 'bg-sky-100 text-sky-700' },
  HALF_DAY: { icon: Clock, className: 'bg-slate-100 text-slate-700' },
  ON_DUTY: { icon: Clock, className: 'bg-indigo-100 text-indigo-700' },
};

export const DailyAttendancePage = () => {
  const { notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegister = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getRegister(date);
      setSessions(res.data || []);
    } catch (error) {
      notifyError(`Failed to load attendance register: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [date, notifyError]);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Attendance Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every session recorded by staff, institution-wide. Marking happens on the Staff portal.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : sessions.length === 0 ? (
        <EmptyState title="No Attendance Recorded" message={`No staff have taken attendance for ${date} yet.`} />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {s.section?.semester?.course?.name} — {s.section?.name} {s.subject?.name ? `· ${s.subject.name}` : ''}
                  </h4>
                  <p className="text-xs text-slate-500">Period {s.periodNumber} • Taken by {s.takenBy?.user?.email || 'Staff'}</p>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {s.records.filter((r) => ['PRESENT', 'LATE', 'ON_DUTY'].includes(r.status)).length} / {s.records.length} Present
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {s.records.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.PRESENT;
                  const Icon = meta.icon;
                  return (
                    <span key={r.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${meta.className}`}>
                      <Icon className="w-3 h-3" /> {r.student.firstName} {r.student.lastName} ({r.student.rollNumber})
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyAttendancePage;
