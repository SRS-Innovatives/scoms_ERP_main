import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Save } from 'lucide-react';

export const ParentMeetingNotesPage = () => {
  const { success } = useNotification();
  const [studentName, setStudentName] = useState('Rohan Verma');
  const [parentName, setParentName] = useState('Mr. Suresh Verma');
  const [discussionNotes, setDiscussionNotes] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    success(`PTM notes recorded for ${studentName}!`, 'Meeting Logged');
    setDiscussionNotes('');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-sky-500" /> Log Parent Teacher Meeting (PTM) Minutes
      </h3>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
            <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Name</label>
            <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Discussion Summary & Action Plan</label>
          <textarea
            required
            rows={4}
            value={discussionNotes}
            onChange={(e) => setDiscussionNotes(e.target.value)}
            placeholder="e.g. Discussed low attendance in Period 1 and physics numerical practice homework..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-5 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Save className="w-4 h-4" /> Record PTM Notes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParentMeetingNotesPage;
