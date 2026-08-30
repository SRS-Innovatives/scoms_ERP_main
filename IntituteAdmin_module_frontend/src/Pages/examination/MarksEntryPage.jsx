import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2 } from 'lucide-react';
import examService from '../../services/examService';

export const MarksEntryPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState('');
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [marksMap, setMarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    try {
      const res = await examService.getMarksRoster(scheduleId);
      setSchedule(res.data.schedule);
      setRoster(res.data.roster);
      const m = {};
      res.data.roster.forEach((s) => { m[s.id] = s.mark?.marksObtained ?? ''; });
      setMarksMap(m);
    } catch (error) {
      notifyError(`Failed to load roster: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [scheduleId, notifyError]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const marks = roster.map((s) => ({ studentId: s.id, marksObtained: marksMap[s.id] }));
      await examService.saveMarks(scheduleId, marks);
      notifySuccess('Marks saved successfully!');
      loadRoster();
    } catch (error) {
      notifyError(`Failed to save marks: ${error.message}`);
    } finally {
      setSaving(false);
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
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{schedule?.subject?.name}</h3>
              <p className="text-xs text-slate-500">Max Marks: {schedule?.maxMarks} • Pass Marks: {schedule?.passMarks}</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Section</th>
                <th className="p-3">Marks Obtained</th>
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
                      value={marksMap[s.id] ?? ''}
                      onChange={(e) => setMarksMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="w-24 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </td>
                  <td className="p-3 font-bold text-slate-600 dark:text-slate-300">{s.mark?.grade || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
