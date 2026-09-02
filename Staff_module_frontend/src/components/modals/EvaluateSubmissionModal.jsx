import React, { useState, useEffect } from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';

export const EvaluateSubmissionModal = ({ isOpen, onClose, submission, onSaved }) => {
  const { success, error: showError } = useNotification();
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMarks(submission?.marksObtained ?? '');
    setFeedback(submission?.feedback ?? '');
  }, [submission]);

  if (!isOpen || !submission) return null;

  const studentName = `${submission.student?.firstName || ''} ${submission.student?.lastName || ''}`.trim() || 'Student';
  const rollNo = submission.student?.rollNumber || '—';
  const submittedOn = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '—';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await assignmentService.evaluateSubmission(submission.id, { marksObtained: marks, feedback });
      success(`Evaluated assignment for ${studentName}! Marks: ${marks}`, 'Grading Saved');
      onSaved && onSaved();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save evaluation', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" /> Evaluate Submission
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Student:</span> {studentName} (Roll #{rollNo})</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Submitted On:</span> {submittedOn}</p>
          {submission.fileUrl ? (
            <p className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold cursor-pointer">
              <FileText className="w-3.5 h-3.5" /> View Uploaded File ({submission.fileUrl})
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{submission.content || 'No text answer submitted.'}</p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks Awarded</label>
            <input
              type="number"
              min={0}
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Teacher Feedback / Comments</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Well written derivations. Good diagrams."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluateSubmissionModal;
