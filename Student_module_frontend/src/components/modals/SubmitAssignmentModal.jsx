import React, { useState } from 'react';
import Modal from './Modal';
import FileUpload from '../common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Upload } from 'lucide-react';
import assignmentService from '../../services/assignmentService';

export const SubmitAssignmentModal = ({ isOpen, onClose, assignment, onSubmitted }) => {
  const { success, error: showError } = useNotification();
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      showError('Please enter a text answer before submitting.', 'Answer Required');
      return;
    }
    setSubmitting(true);
    try {
      await assignmentService.submit({ assignmentId: assignment.id, content: answerText });
      success(`Homework for "${assignment?.title}" submitted successfully!`, 'Assignment Submitted');
      onSubmitted && onSubmitted();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to submit homework', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Submit Assignment: ${assignment?.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Text Answer / Solution Summary</label>
          <textarea
            rows={4}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your answer or GitHub repo link..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
          ></textarea>
        </div>

        <FileUpload label="Attach Solution PDF / ZIP File (optional — not yet stored, use the text answer above)" />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Confirm Submission'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitAssignmentModal;
