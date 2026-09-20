import React, { useEffect, useState } from 'react';
import { Loader2, Bookmark, Trash2, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import reportService from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

export const SavedReportsPage = () => {
  const { error: showError, success } = useNotification();
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    reportService.getSaved()
      .then((res) => setSaved(res.data || []))
      .catch((err) => { showError(`Failed to load saved reports: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    try {
      await reportService.deleteSaved(id);
      success('Saved report removed.');
      load();
    } catch (err) {
      showError(`Failed to delete: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-500" /> Saved Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your saved filter presets, ready to re-run in one click.</p>
        </div>
        <Link to="/admin/reports/center" className="text-xs font-semibold text-indigo-600 hover:underline">← Back to Reports</Link>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
          You haven't saved any report filter presets yet. Generate a report and click "Save Filters" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {saved.map((s) => (
            <div key={s.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.report?.name}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => navigate(`/admin/reports/center?report=${s.report?.code}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded-lg"
                >
                  <Play className="w-3 h-3" /> Generate
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedReportsPage;
