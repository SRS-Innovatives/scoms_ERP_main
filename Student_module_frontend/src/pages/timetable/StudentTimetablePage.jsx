import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import timetableService from '../../services/timetableService';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const staffDisplayName = (s) => {
  if (!s?.user?.email) return s?.employeeCode || '';
  return s.user.email.split('@')[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const StudentTimetablePage = () => {
  const [viewMode, setViewMode] = useState('Daily');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    timetableService.getTimetable()
      .then((res) => setEntries(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load timetable'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <div className="glass-card p-8 rounded-3xl border border-rose-200 dark:border-rose-900 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>;
  }

  const today = DAY_NAMES[new Date().getDay()];
  const todayEntries = entries.filter((e) => e.dayOfWeek === today).sort((a, b) => a.period - b.period);
  const maxPeriod = Math.max(1, ...entries.map((e) => e.period));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">My Class Timetable</h1>
          <p className="text-xs text-slate-500 mt-1">Your section's real, published schedule</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button onClick={() => setViewMode('Daily')} className={`px-3 py-1.5 font-bold rounded-lg transition-all ${viewMode === 'Daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}>
            Today Schedule
          </button>
          <button onClick={() => setViewMode('Weekly')} className={`px-3 py-1.5 font-bold rounded-lg transition-all ${viewMode === 'Weekly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}>
            Weekly Master Grid
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
          Your institution hasn't published a timetable for your section yet.
        </div>
      ) : viewMode === 'Daily' ? (
        <div className="space-y-4">
          {todayEntries.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">No classes scheduled today.</div>
          ) : (
            todayEntries.map((cls) => (
              <div key={cls.id} className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="px-3.5 py-2 rounded-2xl font-black text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">P{cls.period}</div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cls.subject?.name || cls.label || 'Free Period'}</h3>
                      {cls.staff && <p className="text-xs text-slate-500 mt-1">Teacher: <span className="font-semibold text-slate-800 dark:text-slate-200">{staffDisplayName(cls.staff)}</span></p>}
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {cls.startTime} - {cls.endTime}
                        {cls.roomNumber && <span className="flex items-center gap-1 ml-2"><MapPin className="w-3.5 h-3.5" /> {cls.roomNumber}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Period</th>
                {DAYS.map((d) => <th key={d} className="p-3">{DAY_LABELS[d]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {periods.map((p) => (
                <tr key={p} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">P{p}</td>
                  {DAYS.map((d) => {
                    const e = entries.find((x) => x.dayOfWeek === d && x.period === p);
                    return <td key={d} className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{e ? (e.subject?.name || e.label) : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;
