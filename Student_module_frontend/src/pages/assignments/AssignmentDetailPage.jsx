import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeft, Loader2, Calendar, FileText, MessageSquare, Paperclip, Download } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';

export const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [asn, setAsn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentService.getAssignments()
      .then((res) => setAsn((res.data || []).find((a) => a.id === id) || null))
      .catch((err) => showError(err.message || 'Failed to load assignment', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [id, showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!asn) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl text-center text-xs text-slate-500">
        Assignment not found.
        <button onClick={() => navigate('/student/assignments')} className="mt-3 flex items-center gap-1 mx-auto text-indigo-600 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </button>
      </div>
    );
  }

  const status = asn.mySubmission ? (asn.mySubmission.status === 'REVIEWED' ? 'Graded' : (asn.mySubmission.status === 'LATE' ? 'Late' : 'Submitted')) : 'Pending';

  const isImageAttachment = asn.attachmentUrl?.startsWith('data:image');
  const attachmentExt = asn.attachmentUrl?.startsWith('data:application/pdf')
    ? 'pdf'
    : asn.attachmentUrl?.includes('wordprocessingml')
      ? 'docx'
      : asn.attachmentUrl?.startsWith('data:application/msword')
        ? 'doc'
        : isImageAttachment ? (asn.attachmentUrl.includes('png') ? 'png' : 'jpg') : 'file';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={asn.title} subtitle={`${asn.className} • ${asn.subjectName}`} />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <button onClick={() => navigate('/student/assignments')} className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">{new Date(asn.dueDate).toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-slate-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Marks</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">{asn.mySubmission?.marksObtained ?? '—'} / {asn.totalMarks}</p>
          </div>
        </div>

        {asn.description && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Instructions</p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{asn.description}</p>
          </div>
        )}

        {asn.attachmentUrl && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attachment
            </p>
            {isImageAttachment ? (
              <a href={asn.attachmentUrl} target="_blank" rel="noreferrer" className="block">
                <img src={asn.attachmentUrl} alt="Homework attachment" className="max-h-64 rounded-lg border border-slate-200 dark:border-slate-700" />
              </a>
            ) : (
              <a
                href={asn.attachmentUrl}
                download={`${asn.title.replace(/[^a-z0-9]+/gi, '_')}.${attachmentExt}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <FileText className="w-4 h-4" /> Download Attachment ({attachmentExt.toUpperCase()})
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {asn.mySubmission && (
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs space-y-2">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Your Submission</p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{asn.mySubmission.content || '—'}</p>
            <p className="text-slate-400">Submitted: {new Date(asn.mySubmission.submittedAt).toLocaleString()}</p>
          </div>
        )}

        {asn.mySubmission?.feedback && (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Teacher Feedback</p>
            <p className="text-slate-600 dark:text-slate-300">{asn.mySubmission.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
