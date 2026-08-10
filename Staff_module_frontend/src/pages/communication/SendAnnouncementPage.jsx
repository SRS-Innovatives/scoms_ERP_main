import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Send, Users } from 'lucide-react';

export const SendAnnouncementPage = () => {
  const { success } = useNotification();
  const [recipient, setRecipient] = useState('All Class 12-A Parents & Students');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Announcement "${title}" broadcasted to ${recipient}!`, 'Announcement Sent');
    setTitle('');
    setBody('');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Send className="w-5 h-5 text-sky-500" /> Broadcast School / Class Announcement
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipient Group</label>
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
            <option value="All Class 12-A Parents & Students">All Class 12-A Parents & Students</option>
            <option value="Class 11-B Section">Class 11-B Section</option>
            <option value="Class 10-A Section">Class 10-A Section</option>
            <option value="Department Staff">Physics Department Faculty</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Heading</label>
          <input
            type="text"
            required
            placeholder="e.g. Physics Extra Lab Session & Science Fair Selection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Announcement Body</label>
          <textarea
            required
            rows={5}
            placeholder="Write announcement contents..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Send className="w-4 h-4" /> Send Broadcast
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendAnnouncementPage;
