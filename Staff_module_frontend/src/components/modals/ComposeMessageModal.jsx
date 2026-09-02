import React, { useEffect, useState } from 'react';
import { Send, X, Users, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import attendanceService from '../../services/attendanceService';
import smsService from '../../services/smsService';

export const ComposeMessageModal = ({ isOpen, onClose }) => {
  const { success, error: showError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [sectionId, setSectionId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    attendanceService.getMyClasses()
      .then((res) => {
        const mappingsData = res.data || [];
        const seen = new Map();
        mappingsData.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m); });
        const unique = Array.from(seen.values());
        setMappings(unique);
        if (unique.length > 0) setSectionId(unique[0].section.id);
      })
      .catch((err) => showError(err.message || 'Failed to load classes', 'Load Failed'))
      .finally(() => setLoadingClasses(false));
  }, [isOpen, showError]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sectionId || !message.trim()) return;
    setSending(true);
    try {
      const fullMessage = subject.trim() ? `${subject.trim()}: ${message.trim()}` : message.trim();
      const res = await smsService.broadcastToSection(sectionId, fullMessage);
      success(res.message, 'Communication Sent');
      setSubject('');
      setMessage('');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to send message', 'Send Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" /> Send SMS Notice to a Class
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingClasses ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
        ) : mappings.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">You have no assigned classes yet.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
              >
                {mappings.map((m) => (
                  <option key={m.section.id} value={m.section.id}>{m.section?.semester?.course?.name} — {m.section?.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Title (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Extra Class & Project Submission Deadline"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write message details..."
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
                disabled={sending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{sending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ComposeMessageModal;
