import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Send, CheckCircle2, Loader2, Clock } from 'lucide-react';
import examService from '../../services/examService';
import ErrorState from '../../components/common/ErrorState';

export const PublishMarksPage = () => {
  const { success, error: showError } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    examService.getMySchedules()
      .then((res) => {
        const list = res.data || [];
        setSchedules(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      })
      .catch((err) => { showError(err.message || 'Failed to load exam duties', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = schedules.find((s) => s.id === selectedId);

  const handlePublish = async () => {
    if (!selected) return;
    setPublishing(true);
    try {
      await examService.publishMarks(selected.id);
      success(`${selected.subject?.name} — ${selected.exam?.name} marks published live!`, 'Marks Published');
      load();
    } catch (err) {
      showError(err.message || 'Failed to publish marks', 'Publish Failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (schedules.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        You have no exam duties assigned yet.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Publish Class Marks to Student & Parent Portal</h3>
        <p className="text-xs text-slate-500">Once published, marks become visible to students and parents in their own portals.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam / Subject</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>{s.exam?.name} — {s.subject?.name} ({new Date(s.examDate).toLocaleDateString()})</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p>Marks entered: <span className="font-bold">{selected._count?.studentMarks ?? 0}</span> student(s)</p>
          <p>Max Marks: <span className="font-bold">{selected.maxMarks}</span> • Pass Marks: <span className="font-bold">{selected.passMarks}</span></p>
          <p className="flex items-center gap-1.5">
            Status:{' '}
            {selected.isPublished ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Published on {new Date(selected.publishedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" /> Not yet published
              </span>
            )}
          </p>
        </div>
      )}

      <button
        onClick={handlePublish}
        disabled={!selected || selected.isPublished || publishing || (selected?._count?.studentMarks ?? 0) === 0}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl disabled:opacity-50"
      >
        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {selected?.isPublished ? 'Already Published' : publishing ? 'Publishing...' : 'Publish Marks Live'}
      </button>
    </div>
  );
};

export default PublishMarksPage;
