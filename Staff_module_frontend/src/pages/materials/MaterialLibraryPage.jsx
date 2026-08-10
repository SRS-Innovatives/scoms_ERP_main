import React from 'react';
import { mockStudyMaterials } from '../../data/mockStaffData';
import { FolderDown, Download, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MaterialLibraryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Study Materials Library</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">PDFs, lecture slides, notes, and lab manuals for students.</p>
        </div>
        <button
          onClick={() => navigate('/staff/materials/upload')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStudyMaterials.map((mat) => (
          <div key={mat.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {mat.class} • {mat.subject}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{mat.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: <span className="font-semibold text-slate-700 dark:text-slate-300">{mat.type}</span> ({mat.size}) • Downloads: <span className="font-bold text-sky-600">{mat.downloads}</span>
                </p>
              </div>
            </div>
            <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <Download className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialLibraryPage;
