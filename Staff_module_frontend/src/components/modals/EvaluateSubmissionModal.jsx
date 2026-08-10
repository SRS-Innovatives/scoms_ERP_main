import React, { useState } from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const EvaluateSubmissionModal = ({ isOpen, onClose, submission }) => {
  const { success } = useNotification();
  const [marks, setMarks] = useState(submission?.marks || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');

  if (!isOpen || !submission) return null;

  const handleSave = (e) => {
    e.preventDefault();
    success(`Evaluated assignment for ${submission.studentName}! Marks: ${marks}`, 'Grading Saved');
    onClose();
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
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Student:</span> {submission.studentName} (Roll #{submission.rollNo})</p>
          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Submitted On:</span> {submission.submittedOn}</p>
          <p className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> View Uploaded File ({submission.fileUrl})
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks Awarded (Out of 25)</label>
            <input
              type="number"
              max={25}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl shadow-sm transition-all"
            >
              Save Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluateSubmissionModal;
