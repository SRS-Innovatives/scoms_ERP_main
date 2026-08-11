import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { FileText, Download, Bookmark, Video, FileCode } from 'lucide-react';

export const MaterialLibraryPage = () => {
  const { success } = useNotification();

  const materials = [
    { id: "MAT-101", title: "Operating Systems - Unit 1 & 2 Lecture Notes", subject: "Operating Systems", type: "PDF", size: "4.2 MB", faculty: "Dr. Malathi S.", downloads: 142 },
    { id: "MAT-102", title: "Database Systems - ER Diagram & Normalization PPT", subject: "DBMS", type: "PPT", size: "8.5 MB", faculty: "Dr. K. Swaminathan", downloads: 98 },
    { id: "MAT-103", title: "Web Tech Lab React Component Architecture Video", subject: "Web Tech Lab", type: "Video", size: "120 MB", faculty: "Prof. Arvind Rao", downloads: 210 },
    { id: "MAT-104", title: "Previous 5 Years Question Papers Bundle", subject: "All Subjects", type: "ZIP", size: "18.0 MB", faculty: "Exam Cell", downloads: 450 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Digital Study Material Repository" subtitle="Access lecture slides, notes, reference PDFs, videos, and previous question papers." />

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
                    {mat.type} • {mat.size}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{mat.title}</h3>
                  <p className="text-xs text-slate-500">{mat.subject} • Faculty: {mat.faculty}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => success(`Bookmarked ${mat.title}`, 'Bookmarked')}
                className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600"
              >
                <Bookmark className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => success(`Downloading ${mat.title}...`, 'Download Started')}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialLibraryPage;
