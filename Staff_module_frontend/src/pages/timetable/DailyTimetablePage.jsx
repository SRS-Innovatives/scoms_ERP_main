import React, { useState, useEffect } from 'react';
import ScheduleTimeline from '../../components/common/ScheduleTimeline';
import { Loader2 } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useNotification } from '../../context/NotificationContext';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const isCurrentPeriod = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return nowMinutes >= sh * 60 + sm && nowMinutes <= eh * 60 + em;
};

export const DailyTimetablePage = () => {
  const { error: showError } = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableService.getMyTimetable()
      .then((res) => setEntries(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load timetable', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const today = DAY_NAMES[new Date().getDay()];
  const todayEntries = entries
    .filter((e) => e.dayOfWeek === today)
    .sort((a, b) => a.period - b.period)
    .map((e) => ({
      time: `${e.startTime} - ${e.endTime}`,
      subject: e.subject?.name || e.label || 'Free Period',
      class: `${e.timetable?.section?.semester?.course?.name || ''} - ${e.timetable?.section?.name || ''}`,
      period: `Period ${e.period}`,
      room: e.roomNumber || '—',
      status: isCurrentPeriod(e.startTime, e.endTime) ? 'In Progress' : 'Scheduled',
      isCurrent: isCurrentPeriod(e.startTime, e.endTime),
    }));

  return (
    <div className="space-y-6">
      {todayEntries.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
          No classes scheduled for you today.
        </div>
      ) : (
        <ScheduleTimeline schedules={todayEntries} />
      )}
    </div>
  );
};

export default DailyTimetablePage;
