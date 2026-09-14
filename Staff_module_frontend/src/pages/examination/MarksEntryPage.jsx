import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2, Lock, Upload, AlertTriangle } from 'lucide-react';

export const MarksEntryPage = () => {
  const { success, error: showError } = useNotification();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [roster, setRoster] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [importErrors, setImportErrors] = useState([]);
  const fileInputRef = useRef(null);

  const loadRoster = useCallback(async () => {
    if (!scheduleId) { setLoading(false); return; }
    setLoading(true);
    setImportErrors([]);
    try {
      const res = await examService.getRoster(scheduleId);
      setSchedule(res.data.schedule);
      setRoster(res.data.roster);
      const m = {}; const a = {};
      res.data.roster.forEach((s) => { m[s.id] = s.mark?.isAbsent ? '' : (s.mark?.marksObtained ?? ''); a[s.id] = !!s.mark?.isAbsent; });
      setMarksMap(m);
      setAbsentMap(a);
    } catch (err) {
      showError(err.message || 'Failed to load roster', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, showError]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const isLocked = !!schedule?.isPublished;

  const handleSave = async () => {
    setSaving(true);
    try {
      const marks = roster.map((s) => ({ studentId: s.id, marksObtained: marksMap[s.id], isAbsent: !!absentMap[s.id] }));
      await examService.saveMarks(scheduleId, marks);
      success('Marks entry saved to examination database!', 'Marks Saved');
      loadRoster();
    } catch (err) {
      showError(err.message || 'Failed to save marks', 'Save Failed');
    } finally {
      setSaving(false);
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
      success(`${matched.length} row(s) loaded into the grid below — review, then click Save. ${errors.length ? `${errors.length} row(s) could not be matched.` : ''}`, 'Import Complete');
    } catch (err) {
      showError(err.message || 'Import failed', 'Import Failed');
    }
  };

  if (!scheduleId) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        Open marks entry from <b>My Exam Duties</b> — select a subject there to enter marks.
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      {isLocked && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Lock className="w-4 h-4" /> Published — locked. Ask your Institute Admin to unlock this subject if a correction is needed.
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Examination Marks Entry Portal</h3>
          <p className="text-xs text-slate-500">Exam: {schedule?.exam?.name} • Subject: {schedule?.subject?.name} • Max Marks: {schedule?.maxMarks}</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLocked}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-40"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={handleSave} disabled={saving || isLocked} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks Log'}
          </button>
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-400">
          <p className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> {importErrors.length} row(s) from the import couldn't be matched:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {importErrors.map((e, i) => <li key={i}>Row {e.rowNumber} (roll {e.roll}): {e.reason}</li>)}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Section</th>
              <th className="p-3">Marks Obtained (Out of {schedule?.maxMarks})</th>
              <th className="p-3">Absent</th>
              <th className="p-3">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {roster.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-bold">{s.rollNumber}</td>
                <td className="p-3 font-semibold">{s.firstName} {s.lastName}</td>
                <td className="p-3 text-slate-500">{s.section?.name}</td>
                <td className="p-3">
                  <input
                    type="number"
                    max={schedule?.maxMarks}
                    min={0}
                    disabled={isLocked || absentMap[s.id]}
                    value={marksMap[s.id] ?? ''}
                    onChange={(e) => setMarksMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-50"
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
                <td className="p-3 font-bold text-sky-600">{absentMap[s.id] ? 'AB' : (s.mark?.grade || '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksEntryPage;
