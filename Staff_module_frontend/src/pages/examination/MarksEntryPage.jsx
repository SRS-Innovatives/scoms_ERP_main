import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import examService from '../../services/examService';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2 } from 'lucide-react';

export const MarksEntryPage = () => {
  const { success, error: showError } = useNotification();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [roster, setRoster] = useState([]);
  const [marksMap, setMarksMap] = useState({});

  const loadRoster = useCallback(async () => {
    if (!scheduleId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await examService.getRoster(scheduleId);
      setSchedule(res.data.schedule);
      setRoster(res.data.roster);
      const m = {};
      res.data.roster.forEach((s) => { m[s.id] = s.mark?.marksObtained ?? ''; });
      setMarksMap(m);
    } catch (err) {
      showError(err.message || 'Failed to load roster', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, showError]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const marks = roster.map((s) => ({ studentId: s.id, marksObtained: marksMap[s.id] }));
      await examService.saveMarks(scheduleId, marks);
      success('Marks entry saved to examination database!', 'Marks Saved');
      loadRoster();
    } catch (err) {
      showError(err.message || 'Failed to save marks', 'Save Failed');
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Examination Marks Entry Portal</h3>
          <p className="text-xs text-slate-500">Exam: {schedule?.exam?.name} • Subject: {schedule?.subject?.name} • Max Marks: {schedule?.maxMarks}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks Log'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
            <tr>
              <th className="p-3">Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Section</th>
              <th className="p-3">Marks Obtained (Out of {schedule?.maxMarks})</th>
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
                    value={marksMap[s.id] ?? ''}
                    onChange={(e) => setMarksMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  />
                </td>
                <td className="p-3 font-bold text-sky-600">{s.mark?.grade || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksEntryPage;
