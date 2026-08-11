import React, { useState } from 'react';
import Modal from './Modal';
import FileUpload from '../common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { Upload } from 'lucide-react';

export const SubmitAssignmentModal = ({ isOpen, onClose, assignment }) => {
  const { success } = useNotification();
  const [answerText, setAnswerText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Homework for "${assignment?.title}" submitted successfully!`, 'Assignment Submitted');
    onClose();
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

        <FileUpload label="Upload Solution PDF / ZIP File (Max 15MB)" />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Confirm Submission
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitAssignmentModal;
