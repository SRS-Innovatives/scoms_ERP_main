import React, { useEffect, useState, useCallback } from 'react';
import { FolderDown, ExternalLink, FileText, Plus, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import materialService from '../../services/materialService';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';

export const MaterialLibraryPage = () => {
  const navigate = useNavigate();
  const { error: showError, success } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    materialService.getMaterials()
      .then((res) => setMaterials(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load materials', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    const mat = confirming;
    try {
      await materialService.deleteMaterial(mat.id);
      success(`Removed "${mat.title}"`, 'Material Removed');
      load();
    } catch (err) {
      showError(err.message || 'Failed to remove material', 'Delete Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Study Materials Library</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Notes, slides, and reference links shared across your institution.</p>
        </div>
        <button
          onClick={() => navigate('/staff/materials/upload')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Share Material
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : materials.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <FolderDown className="w-8 h-8 text-slate-300" /> No study materials shared yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => (
            <div key={mat.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {mat.subject?.name || 'General'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{mat.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format: <span className="font-semibold text-slate-700 dark:text-slate-300">{mat.fileType}</span>
                    {mat.fileSize && ` (${mat.fileSize})`} • By {mat.staff?.firstName} {mat.staff?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button onClick={() => setConfirming(mat)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        title="Remove Material?"
        message={confirming ? `"${confirming.title}" will no longer be visible to students. This cannot be undone.` : ''}
      />
    </div>
  );
};

export default MaterialLibraryPage;
