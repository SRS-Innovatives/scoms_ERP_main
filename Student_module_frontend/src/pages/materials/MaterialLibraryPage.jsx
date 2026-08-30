import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { FileText, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import materialService from '../../services/materialService';

export const MaterialLibraryPage = () => {
  const { error: showError } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    materialService.getMaterials()
      .then((res) => setMaterials(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load materials', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Digital Study Material Repository" subtitle="Access lecture slides, notes, reference links, and videos shared by your faculty." />

      {materials.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <FolderOpen className="w-8 h-8 text-slate-300" /> No study materials have been shared for your class yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div key={mat.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                      {mat.fileType}{mat.fileSize ? ` • ${mat.fileSize}` : ''}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{mat.title}</h3>
                    <p className="text-xs text-slate-500">{mat.subject?.name || 'General'} • Faculty: {mat.staff?.firstName} {mat.staff?.lastName}</p>
                  </div>
                </div>
              </div>

              {mat.description && <p className="text-xs text-slate-500">{mat.description}</p>}

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" /> Open Resource
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialLibraryPage;
