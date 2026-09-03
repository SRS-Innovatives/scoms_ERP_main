import React, { useState, useEffect, useCallback } from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Clock, BookOpen, Save, Loader2 } from 'lucide-react';

const UI_TO_STATUS = { Present: 'PRESENT', Absent: 'ABSENT', Late: 'LATE', 'On Duty': 'LEAVE' };

export const TakeAttendancePage = () => {
  const { success, error: showError } = useNotification();
  const [myClasses, setMyClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodNumber, setPeriodNumber] = useState(1);

  const [roster, setRoster] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);

  useEffect(() => {
    attendanceService.getMyClasses()
      .then((res) => setMyClasses(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load assigned classes', 'Load Failed'))
      .finally(() => setLoadingClasses(false));

    attendanceService.getSmsStatus()
      .then((res) => setSmsEnabled(res.data?.enabled !== false))
      .catch(() => {}); // non-critical — the save flow itself is the source of truth either way
  }, [showError]);

  const selectedMapping = myClasses.find((m) => m.id === selectedMappingId);

  const loadRosterAndSession = useCallback(async () => {
    if (!selectedMapping) return;
    setLoadingRoster(true);
    try {
      const [rosterRes, sessionRes] = await Promise.all([
        attendanceService.getRoster(selectedMapping.section.id),
        attendanceService.getSession(selectedMapping.section.id, selectedDate, periodNumber),
      ]);
      setRoster(rosterRes.data || []);
      setAlreadyRecorded(!!sessionRes.data);
      const initial = {};
      (rosterRes.data || []).forEach((s) => { initial[s.id] = 'Present'; });
      setStatusMap(initial);
    } catch (err) {
      showError(err.message || 'Failed to load roster', 'Load Failed');
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedMapping, selectedDate, periodNumber, showError]);

  useEffect(() => {
    if (selectedMapping) loadRosterAndSession();
  }, [selectedMapping, selectedDate, periodNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveAttendance = async () => {
    if (!selectedMapping) return;
    setSaving(true);
    try {
      const records = roster.map((s) => ({
        studentId: s.id,
        status: UI_TO_STATUS[statusMap[s.id] || 'Present'],
      }));
      await attendanceService.markAttendance({
        sectionId: selectedMapping.section.id,
        subjectId: selectedMapping.subject.id,
        date: selectedDate,
        periodNumber,
        records,
      });
      const absentCount = records.filter((r) => r.status === 'ABSENT').length;
      const smsNote = absentCount === 0 ? '' : smsEnabled ? ` SMS alerts sent to ${absentCount} parent(s).` : ` (${absentCount} absent — SMS alerts are turned off by your admin.)`;
      success(
        `Attendance for ${selectedMapping.section.name} (${selectedMapping.subject.name}) recorded.${smsNote}`,
        'Attendance Saved'
      );
      setAlreadyRecorded(true);
    } catch (err) {
      showError(err.message || 'Failed to save attendance', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const tableStudents = roster.map((s) => ({
    id: s.id,
    rollNo: s.rollNumber || s.admissionNumber,
    name: `${s.firstName} ${s.lastName}`,
    class: selectedMapping ? `${selectedMapping.section.semester?.course?.name || ''} - ${selectedMapping.section.name}` : '',
    attendancePercent: '—',
    parentContact: '—',
    status: statusMap[s.id] || 'Present',
  }));

  if (loadingClasses) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          Mark Classroom Attendance
        </h3>

        {myClasses.length === 0 ? (
          <p className="text-xs text-slate-500">You have no assigned classes yet. Ask your Institute Admin to assign you to a subject/section.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-500" /> Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Period
              </label>
              <select
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((p) => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Class & Subject
              </label>
              <select
                value={selectedMappingId}
                onChange={(e) => setSelectedMappingId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select class...</option>
                {myClasses.map((m) => (
                  <option key={m.id} value={m.id}>{m.section.name} — {m.subject.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loadingRoster ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : selectedMapping && alreadyRecorded ? (
        <div className="glass-card p-6 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
          Attendance for this class, date, and period is already recorded. Use <b>Edit Attendance</b> to make changes.
        </div>
      ) : selectedMapping ? (
        <>
          <AttendanceTable
            students={tableStudents}
            onStatusChange={(studentId, status) => setStatusMap((prev) => ({ ...prev, [studentId]: status }))}
            onSendSms={() => smsEnabled
              ? success('Absence SMS is sent automatically to parents when you save attendance.', 'Automatic')
              : showError('Your Institute Admin has turned off automatic absence SMS for staff. Marks will still be recorded.', 'SMS Disabled')}
          />

          <div className={`glass-card p-4 rounded-2xl border flex items-center justify-between ${smsEnabled ? 'border-slate-200 dark:border-slate-800' : 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20'}`}>
            <span className={`text-xs ${smsEnabled ? 'text-slate-500 dark:text-slate-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {smsEnabled
                ? "Absent students' parents receive an SMS automatically when you save."
                : 'Automatic absence SMS is currently turned off by your Institute Admin.'}
            </span>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance Log'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default TakeAttendancePage;
