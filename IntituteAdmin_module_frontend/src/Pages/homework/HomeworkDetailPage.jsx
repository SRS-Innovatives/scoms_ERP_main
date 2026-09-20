import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { ArrowLeft, Loader2, Calendar, Paperclip, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import homeworkService from '../../services/homeworkService';
import ErrorState from '../../components/common/ErrorState';

export const HomeworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    homeworkService.getById(id)
      .then((res) => setHw(res.data))
      .catch((err) => { showError(err.message || 'Failed to load homework', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [id, showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!hw) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl text-center text-xs text-slate-500">
        Homework post not found.
        <button onClick={() => navigate('/admin/homework')} className="mt-3 flex items-center gap-1 mx-auto text-indigo-600 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Homework
        </button>
      </div>
    );
  }

  const isImageAttachment = hw.attachmentUrl?.startsWith('data:image');
  const attachmentExt = hw.attachmentUrl?.startsWith('data:application/pdf')
    ? 'pdf'
    : hw.attachmentUrl?.includes('wordprocessingml')
      ? 'docx'
      : hw.attachmentUrl?.startsWith('data:application/msword')
        ? 'doc'
        : isImageAttachment ? (hw.attachmentUrl.includes('png') ? 'png' : 'jpg') : 'file';

  const submittedCount = hw.roster.filter((r) => r.submission).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/admin/homework')} className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
        <ArrowLeft className="w-4 h-4" /> Back to Homework
      </button>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{hw.className} • {hw.subjectName}</p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{hw.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Posted by {hw.staff?.firstName} {hw.staff?.lastName} ({hw.staff?.user?.email})
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">{new Date(hw.dueDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-slate-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Max Marks</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">{hw.totalMarks}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-slate-500">Submitted</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">{submittedCount} / {hw.roster.length}</p>
          </div>
        </div>

        {hw.description && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Instructions</p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{hw.description}</p>
          </div>
        )}

        {hw.attachmentUrl && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attachment
            </p>
            {isImageAttachment ? (
              <a href={hw.attachmentUrl} target="_blank" rel="noreferrer" className="block">
                <img src={hw.attachmentUrl} alt="Homework attachment" className="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700" />
              </a>
            ) : (
              <a
                href={hw.attachmentUrl}
                download={`${hw.title.replace(/[^a-z0-9]+/gi, '_')}.${attachmentExt}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <FileText className="w-4 h-4" /> Download Attachment ({attachmentExt.toUpperCase()})
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Class Roster & Submission Status</h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Roll No.</th>
              <th className="text-left px-4 py-2.5 font-semibold">Student</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Submitted At</th>
              <th className="text-right px-4 py-2.5 font-semibold">Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {hw.roster.map((r) => (
              <tr key={r.studentId}>
                <td className="px-4 py-2.5 font-mono text-slate-500">{r.rollNumber || '—'}</td>
                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{r.name}</td>
                <td className="px-4 py-2.5">
                  {r.submission ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Submitted</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-semibold"><XCircle className="w-3.5 h-3.5" /> Not Submitted</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{r.submission ? new Date(r.submission.submittedAt).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-2.5 text-right font-mono">{r.submission?.marksObtained ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HomeworkDetailPage;
