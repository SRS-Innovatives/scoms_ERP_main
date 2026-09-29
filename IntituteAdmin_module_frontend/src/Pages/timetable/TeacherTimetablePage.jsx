import React, { useState, useEffect, useCallback } from 'react';
import { User, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import staffService from '../../services/staffService';
import timetableService from '../../services/timetableService';
import ErrorState from '../../components/common/ErrorState';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };

const staffDisplayName = (s) => {
  if (!s?.user?.email) return s?.employeeCode || '—';
  return s.user.email.split('@')[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const TeacherTimetablePage = () => {
  const { notifyError } = useNotification();
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStaff = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getAll()
      .then((res) => {
        setStaffList(res.data || []);
        if ((res.data || []).length > 0) setStaffId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load staff: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const loadTeacherTimetable = useCallback(() => {
    if (!staffId) return;
    setLoading(true);
    setError(false);
    timetableService.getForTeacher(staffId)
      .then((res) => setEntries(res.data || []))
      .catch((err) => { notifyError(`Failed to load teacher timetable: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [staffId, notifyError]);

  useEffect(() => { loadTeacherTimetable(); }, [loadTeacherTimetable]);

  const selectedStaff = staffList.find((s) => s.id === staffId);
  const byDay = {};
  DAYS.forEach((d) => { byDay[d] = entries.filter((e) => e.dayOfWeek === d).sort((a, b) => a.period - b.period); });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Individual Workload & Timetable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assigned classes per teacher, drawn from the real class timetable</p>
        </div>

        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
          {staffList.map((s) => <option key={s.id} value={s.id}>{staffDisplayName(s)} ({s.department?.name || s.designation})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={() => { loadStaff(); loadTeacherTimetable(); }} />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs text-xs">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900">
              <User className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{selectedStaff ? staffDisplayName(selectedStaff) : '—'}</p>
                <p className="text-slate-500">Total Teaching Workload: <span className="font-mono font-bold text-indigo-600">{entries.length} Periods / Week</span></p>
              </div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
              No timetable slots assigned to this teacher yet.
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS.filter((d) => byDay[d].length > 0).map((day) => (
                <div key={day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-xs text-slate-900 dark:text-white">{DAY_LABELS[day]}</div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {byDay[day].map((e) => (
                      <div key={e.id} className="p-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-600">Period {e.period} ({e.startTime}-{e.endTime})</span>
                        <span className="font-bold text-slate-900 dark:text-white">{e.subject?.name || '—'}</span>
                        <span className="text-slate-500">{e.timetable?.section?.semester?.course?.name} - {e.timetable?.section?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherTimetablePage;
