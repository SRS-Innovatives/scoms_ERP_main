import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeft, Loader2, Calendar, FileText, MessageSquare, Paperclip, Download, Send } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useStudentAuth } from '../../context/StudentAuthContext';
import assignmentService from '../../services/assignmentService';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

export const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const { isParent } = useStudentAuth();
  const [asn, setAsn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    assignmentService.getAssignments()
      .then((res) => {
        const found = (res.data || []).find((a) => a.id === id) || null;
        setAsn(found);
        setContent(found?.mySubmission?.content || '');
      })
      .catch((err) => showError(err.message || 'Failed to load assignment', 'Load Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showError('Attachment must be 5MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setFileUrl(reader.result); setFileName(file.name); };
    reader.onerror = () => showError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !fileUrl) {
      showError('Add a note or attach a file before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await assignmentService.submit({ assignmentId: id, content: content.trim() || undefined, fileUrl: fileUrl || undefined });
      success('Homework submitted successfully!');
      setFileUrl('');
      setFileName('');
      setLoading(true);
      load();
    } catch (err) {
      showError(err.message || 'Failed to submit homework', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

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

        {isParent ? (
          <p className="text-[11px] text-slate-400 text-center py-2">Submitting homework can only be done by the student themselves, not a parent account.</p>
        ) : asn.mySubmission?.status === 'REVIEWED' ? null : (
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-3">
            <p className="font-semibold text-slate-700 dark:text-slate-300">{asn.mySubmission ? 'Resubmit Homework' : 'Submit Homework'}</p>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your answer or notes here..."
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-indigo-600 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                <Paperclip className="w-3.5 h-3.5" /> Attach File
                <input type="file" className="hidden" onChange={handleFileSelect} />
              </label>
              {fileName && <span className="text-slate-500 truncate">{fileName}</span>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {submitting ? 'Submitting...' : (asn.mySubmission ? 'Resubmit' : 'Submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
