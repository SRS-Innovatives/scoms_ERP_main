import React, { useState, useEffect } from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { Edit3, Save, Loader2 } from 'lucide-react';

const STATUS_TO_UI = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', LEAVE: 'On Duty', HALF_DAY: 'Present' };
const UI_TO_STATUS = { Present: 'PRESENT', Absent: 'ABSENT', Late: 'LATE', 'On Duty': 'LEAVE' };

export const EditAttendancePage = () => {
  const { success, error: showError } = useNotification();
  const [myClasses, setMyClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodNumber, setPeriodNumber] = useState(1);

  const [session, setSession] = useState(null);
  const [roster, setRoster] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    attendanceService.getMyClasses()
      .then((res) => setMyClasses(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load assigned classes', 'Load Failed'))
      .finally(() => setLoadingClasses(false));
  }, [showError]);

  const selectedMapping = myClasses.find((m) => m.id === selectedMappingId);

  useEffect(() => {
    if (!selectedMapping) return;
    setLoadingSession(true);
    setSession(null);
    Promise.all([
      attendanceService.getSession(selectedMapping.section.id, selectedDate, periodNumber),
      attendanceService.getRoster(selectedMapping.section.id),
    ])
      .then(([sessionRes, rosterRes]) => {
        setSession(sessionRes.data);
        setRoster(rosterRes.data || []);
        const initial = {};
        (sessionRes.data?.records || []).forEach((r) => { initial[r.studentId] = STATUS_TO_UI[r.status] || 'Present'; });
        setStatusMap(initial);
      })
      .catch((err) => showError(err.message || 'Failed to load session', 'Load Failed'))
      .finally(() => setLoadingSession(false));
  }, [selectedMapping, selectedDate, periodNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const records = roster.map((s) => ({ studentId: s.id, status: UI_TO_STATUS[statusMap[s.id] || 'Present'] }));
      await attendanceService.updateAttendance(session.id, records);
      success('Updated attendance register saved!', 'Attendance Modified');
    } catch (err) {
      showError(err.message || 'Failed to update attendance', 'Update Failed');
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
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" /> Edit Past Attendance Record
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select class, date, and period to modify an already-recorded attendance log.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <select value={selectedMappingId} onChange={(e) => setSelectedMappingId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
            <option value="">Select class...</option>
            {myClasses.map((m) => <option key={m.id} value={m.id}>{m.section.name} — {m.subject.name}</option>)}
          </select>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
          <select value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
            {[1, 2, 3, 4, 5, 6, 7].map((p) => <option key={p} value={p}>Period {p}</option>)}
          </select>
        </div>
      </div>

      {loadingSession ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : selectedMapping && !session ? (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
          No attendance recorded yet for this class, date, and period — use <b>Take Attendance</b> instead.
        </div>
      ) : session ? (
        <>
          <AttendanceTable
            students={tableStudents}
            onStatusChange={(studentId, status) => setStatusMap((prev) => ({ ...prev, [studentId]: status }))}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Modifications'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default EditAttendancePage;
