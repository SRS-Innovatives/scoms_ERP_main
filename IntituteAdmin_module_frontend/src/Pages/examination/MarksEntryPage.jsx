import React, { useState, useEffect, useCallback, useRef } from 'react';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2, Lock, Unlock, Upload, X, AlertTriangle } from 'lucide-react';
import examService from '../../services/examService';

/** Admin-only: a published result is locked in saveMarks on the backend — this prompts
 * for a reason and calls unlock, exactly mirroring the backend's own requirement. */
const UnlockModal = ({ isOpen, onClose, onConfirm, submitting }) => {
  const [reason, setReason] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Unlock for Correction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">This result is currently published and visible to students. Unlocking hides it again until you re-publish — the reason is recorded on the audit trail.</p>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Reason</label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Entered wrong marks for one student, correcting it"
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={submitting || !reason.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {submitting ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MarksEntryPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState('');
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [marksMap, setMarksMap] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    examService.getExams()
      .then((res) => {
        setExams(res.data || []);
        if ((res.data || []).length > 0) setExamId(res.data[0].id);
      })
      .catch((err) => notifyError(`Failed to load exams: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => {
    if (!examId) return;
    examService.getSchedules(examId).then((res) => {
      setSchedules(res.data || []);
      setScheduleId((res.data || [])[0]?.id || '');
    }).catch((err) => notifyError(`Failed to load schedules: ${err.message}`));
  }, [examId, notifyError]);

  const loadRoster = useCallback(async () => {
    if (!scheduleId) { setRoster([]); setSchedule(null); return; }
    setLoading(true);
    setImportErrors([]);
    try {
      const res = await examService.getMarksRoster(scheduleId);
      setSchedule(res.data.schedule);
      setRoster(res.data.roster);
      const m = {}; const a = {};
      res.data.roster.forEach((s) => { m[s.id] = s.mark?.isAbsent ? '' : (s.mark?.marksObtained ?? ''); a[s.id] = !!s.mark?.isAbsent; });
      setMarksMap(m);
      setAbsentMap(a);
    } catch (error) {
      notifyError(`Failed to load roster: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [scheduleId, notifyError]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const isLocked = !!schedule?.isPublished;

  const handleSave = async () => {
    setSaving(true);
    try {
      const marks = roster.map((s) => ({ studentId: s.id, marksObtained: marksMap[s.id], isAbsent: !!absentMap[s.id] }));
      await examService.saveMarks(scheduleId, marks);
      notifySuccess('Marks saved successfully!');
      loadRoster();
    } catch (error) {
      notifyError(`Failed to save marks: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async (reason) => {
    setUnlocking(true);
    try {
      await examService.unlockSchedule(scheduleId, reason);
      notifySuccess('Unlocked for correction — remember to re-publish once you\'re done');
      setUnlockOpen(false);
      loadRoster();
    } catch (error) {
      notifyError(error.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await examService.importMarksCsv(scheduleId, file);
      const { matched, errors } = res.data;
      setMarksMap((prev) => {
        const next = { ...prev };
        matched.forEach((r) => { next[r.studentId] = r.isAbsent ? '' : r.marksObtained; });
        return next;
      });
      setAbsentMap((prev) => {
        const next = { ...prev };
        matched.forEach((r) => { next[r.studentId] = r.isAbsent; });
        return next;
      });
      setImportErrors(errors);
      notifySuccess(`${matched.length} row(s) loaded into the grid below — review, then click Save Marks. ${errors.length ? `${errors.length} row(s) could not be matched.` : ''}`);
    } catch (error) {
      notifyError(`Import failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Marks Entry (Admin Oversight)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enter or correct marks for any subject — staff normally enter their own subject's marks</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {schedules.map((s) => <option key={s.id} value={s.id}>{s.subject?.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : !scheduleId ? (
        <EmptyState title="No Exam Schedule Selected" message="Select an exam with at least one subject schedule." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {isLocked && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Lock className="w-4 h-4" /> Published — locked. Students can already see this result.
              </div>
              <button onClick={() => setUnlockOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold">
                <Unlock className="w-3.5 h-3.5" /> Unlock for Correction
              </button>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{schedule?.subject?.name}</h3>
              <p className="text-xs text-slate-500">Max Marks: {schedule?.maxMarks} • Pass Marks: {schedule?.passMarks}</p>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLocked}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40"
                title="Import Roll Number / Marks Obtained / Absent columns from a .csv or .xlsx file"
              >
                <Upload className="w-4 h-4" /> Import CSV
              </button>
              <button onClick={handleSave} disabled={saving || isLocked} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </div>

          {importErrors.length > 0 && (
            <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-400">
              <p className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> {importErrors.length} row(s) from the import couldn't be matched:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {importErrors.map((e, i) => <li key={i}>Row {e.rowNumber} (roll {e.roll}): {e.reason}</li>)}
              </ul>
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Section</th>
                <th className="p-3">Marks Obtained</th>
                <th className="p-3">Absent</th>
                <th className="p-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {roster.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 font-mono font-bold text-indigo-600">{s.rollNumber}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</td>
                  <td className="p-3 text-slate-500">{s.section?.name}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      max={schedule?.maxMarks}
                      disabled={isLocked || absentMap[s.id]}
                      value={marksMap[s.id] ?? ''}
                      onChange={(e) => setMarksMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="w-24 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={!!absentMap[s.id]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAbsentMap((prev) => ({ ...prev, [s.id]: checked }));
                        if (checked) setMarksMap((prev) => ({ ...prev, [s.id]: '' }));
                      }}
                      className="w-4 h-4 rounded text-rose-600 disabled:opacity-50"
                    />
                  </td>
                  <td className="p-3 font-bold text-slate-600 dark:text-slate-300">{absentMap[s.id] ? 'AB' : (s.mark?.grade || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UnlockModal isOpen={unlockOpen} onClose={() => setUnlockOpen(false)} onConfirm={handleUnlock} submitting={unlocking} />
    </div>
  );
};

export default MarksEntryPage;
