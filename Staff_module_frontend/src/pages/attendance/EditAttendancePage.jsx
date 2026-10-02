import React, { useState, useEffect, useCallback } from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { Edit3, Save, Loader2, Lock } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

// LEAVE and HALF_DAY have no button of their own; rows are only sent when the teacher
// changes them, so those statuses are never silently overwritten.
const STATUS_TO_UI = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', ON_DUTY: 'On Duty', LEAVE: 'On Duty', HALF_DAY: 'Present' };
const UI_TO_STATUS = { Present: 'PRESENT', Absent: 'ABSENT', Late: 'LATE', 'On Duty': 'ON_DUTY' };

export const EditAttendancePage = () => {
  const { success, error: showError } = useNotification();
  const [myClasses, setMyClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodNumber, setPeriodNumber] = useState(1);

  const [session, setSession] = useState(null);
  const [roster, setRoster] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [originalMap, setOriginalMap] = useState({});
  const [reason, setReason] = useState('');
  const [myCorrections, setMyCorrections] = useState([]);

  const loadCorrections = useCallback(() => {
    attendanceService.getMyCorrections().then((res) => setMyCorrections(res.data || [])).catch(() => setMyCorrections([]));
  }, []);

  useEffect(() => { loadCorrections(); }, [loadCorrections]);

  const loadClasses = useCallback(() => {
    setLoadingClasses(true);
    setClassesError(false);
    attendanceService.getMyClasses()
      .then((res) => setMyClasses(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load assigned classes', 'Load Failed'); setClassesError(true); })
      .finally(() => setLoadingClasses(false));
  }, [showError]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

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
        setOriginalMap(initial);
        setReason('');
      })
      .catch((err) => showError(err.message || 'Failed to load session', 'Load Failed'))
      .finally(() => setLoadingSession(false));
  }, [selectedMapping, selectedDate, periodNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const changedRecords = roster
    .filter((s) => originalMap[s.id] === undefined || (statusMap[s.id] || 'Present') !== originalMap[s.id])
    .map((s) => ({ studentId: s.id, status: UI_TO_STATUS[statusMap[s.id] || 'Present'] }));

  const handleSave = async () => {
    if (!session) return;
    if (changedRecords.length === 0) { showError('No changes to save', 'Nothing Changed'); return; }
    if (session.locked && !reason.trim()) { showError('Enter a reason for the correction', 'Reason Required'); return; }
    setSaving(true);
    try {
      if (session.locked) {
        const results = await Promise.allSettled(
          changedRecords.map((r) => attendanceService.requestCorrection(session.id, { studentId: r.studentId, newStatus: r.status, reason }))
        );
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) showError(`${failed.length} request(s) failed: ${failed[0].reason?.message}`, 'Some Requests Failed');
        if (failed.length < results.length) success(`${results.length - failed.length} correction request(s) sent for approval`, 'Requests Raised');
        loadCorrections();
        return;
      }
      await attendanceService.updateAttendance(session.id, changedRecords);
      setOriginalMap(statusMap);
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

  if (classesError) {
    return <ErrorState onRetry={loadClasses} />;
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
          {session.locked && (
            <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs space-y-2">
              <p className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <Lock className="w-4 h-4" /> This session is locked. Changes are sent to your HOD / admin as correction requests.
              </p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for correction (required)" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || changedRecords.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : session.locked ? `Request ${changedRecords.length} Correction(s)` : `Save Modifications (${changedRecords.length})`}
            </button>
          </div>
        </>
      ) : null}

      {myCorrections.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">My Correction Requests</p>
          {myCorrections.slice(0, 10).map((c) => (
            <p key={c.id} className="text-slate-600 dark:text-slate-400">
              {new Date(c.session?.date).toLocaleDateString()} P{c.session?.periodNumber} · {c.session?.section?.name} · {c.student?.firstName} {c.student?.lastName}: {c.oldStatus || '—'} → {c.newStatus} · <span className="font-bold">{c.status}</span>
              {c.reviewRemarks ? ` (${c.reviewRemarks})` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditAttendancePage;
