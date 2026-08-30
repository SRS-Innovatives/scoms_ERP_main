import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import timetableService from '../../services/timetableService';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const staffDisplayName = (s) => {
  if (!s?.user?.email) return s?.employeeCode || '';
  return s.user.email.split('@')[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const MyClassesPage = () => {
  const navigate = useNavigate();
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
  const todayEntries = entries.filter((e) => e.dayOfWeek === today && e.subject).sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-6">
      <PageHeader title="Today's Classes" subtitle="Your section's real schedule for today, from the published timetable." />

      {todayEntries.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
          No classes scheduled for today.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {todayEntries.map((cls) => (
            <div key={cls.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                    {cls.subject?.code || `P${cls.period}`}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{cls.subject?.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    {cls.staff && <span>{staffDisplayName(cls.staff)} • </span>}
                    <Clock className="w-3.5 h-3.5" /> {cls.startTime} - {cls.endTime}
                    {cls.roomNumber && <span className="flex items-center gap-1 ml-1"><MapPin className="w-3.5 h-3.5" /> {cls.roomNumber}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => navigate('/student/materials')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  View Study Materials
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Online lecture links aren't configured for these classes — check with your subject teacher for virtual session details.
      </p>
    </div>
  );
};

export default MyClassesPage;
