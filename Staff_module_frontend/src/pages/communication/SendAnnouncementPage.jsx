import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Send, Megaphone, Loader2 } from 'lucide-react';
import announcementService from '../../services/announcementService';

export const SendAnnouncementPage = () => {
  const { success, error: showError } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [targetRole, setTargetRole] = useState('STUDENTS');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll();
      setAnnouncements(res.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load announcements', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementService.create({ title, content: body, targetRole });
      success(`Announcement "${title}" published!`, 'Announcement Sent');
      setTitle('');
      setBody('');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to publish announcement', 'Send Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Send className="w-5 h-5 text-sky-500" /> Broadcast School / Class Announcement
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
              <option value="STUDENTS">Students</option>
              <option value="ALL">Everyone at the Institution</option>
              <option value="STAFF">Staff Only</option>
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
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
              <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-indigo-500" /> Recent Notices
        </h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No announcements posted yet.</p>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {announcements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{a.targetRole}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{a.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendAnnouncementPage;
