import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import ErrorState from '../../components/common/ErrorState';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLOR = {
  PRESENT: 'bg-emerald-500 text-white',
  LATE: 'bg-amber-500 text-white',
  ABSENT: 'bg-rose-500 text-white',
  HALF_DAY: 'bg-sky-400 text-white',
  LEAVE: 'bg-slate-400 text-white',
};

export const MyStaffAttendancePage = () => {
  const { error: showError } = useNotification();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAttendance = useCallback(() => {
    setLoading(true);
    setError(false);
    profileService.getMyAttendance(month, year)
      .then((res) => setData(res.data))
      .catch((err) => { showError(err.message || 'Failed to load attendance', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [month, year, showError]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const byDate = {};
  (data?.records || []).forEach((r) => { byDate[new Date(r.date).getUTCDate()] = r; });

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> My Attendance Log & Calendar Heatmap
          </h3>
          <p className="text-xs text-slate-500">Marked by your Institute Admin • {MONTH_NAMES[month]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
          {!loading && data && (
            <div className="text-right text-xs">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">{data.punctualityRate}%</span>
              <p className="text-slate-400">Punctuality Rate</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchAttendance} />
      ) : (
        <>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attendance Heatmap Grid</h4>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="font-bold text-slate-400 text-[11px] py-1">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const rec = byDate[day];
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center font-semibold ${rec ? STATUS_COLOR[rec.status] || 'bg-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                    title={rec ? `${rec.status}${rec.checkInTime ? ` (${rec.checkInTime})` : ''}` : 'Not marked'}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.presentCount}</p><p className="text-slate-400">Present Days</p></div>
            <div className="text-center"><p className="text-2xl font-black text-amber-600">{data.lateCount}</p><p className="text-slate-400">Late Days</p></div>
            <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.totalMarked}</p><p className="text-slate-400">Days Marked</p></div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyStaffAttendancePage;
