import React, { useEffect, useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import attendanceService from '../../services/attendanceService';
import smsService from '../../services/smsService';
import ErrorState from '../../components/common/ErrorState';

export const SmsCenterPage = () => {
  const { success, error: showError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    attendanceService.getMyClasses()
      .then((res) => {
        const mappingsData = res.data || [];
        const seen = new Map();
        mappingsData.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m); });
        const unique = Array.from(seen.values());
        setMappings(unique);
        if (unique.length > 0) setSectionId(unique[0].section.id);
      })
      .catch((err) => { showError(err.message || 'Failed to load classes', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!sectionId || !message.trim()) return;
    setSending(true);
    try {
      const res = await smsService.broadcastToSection(sectionId, message.trim());
      success(res.message, 'SMS Broadcast Sent');
      setMessage('');
    } catch (err) {
      showError(err.message || 'Failed to send SMS broadcast', 'Send Failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (mappings.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-xl">
        You have no assigned classes yet. Ask your Institute Admin to assign you to a subject/section first.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">SMS Broadcast Center</h3>
        <p className="text-xs text-slate-500">Send a real SMS alert to every parent of a class you teach.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Section</label>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {mappings.map((m) => (
            <option key={m.section.id} value={m.section.id}>{m.section?.semester?.course?.name} — {m.section?.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your broadcast message..."
          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Sending...' : 'Send Bulk SMS Broadcast'}
      </button>
    </div>
  );
};

export default SmsCenterPage;
