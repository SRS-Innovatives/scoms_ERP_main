import React, { useEffect, useState } from 'react';
import { MessageSquare, PhoneCall, Send, Loader2 } from 'lucide-react';
import smsService from '../../services/smsService';
import { useNotification } from '../../context/NotificationContext';

export const ParentMessagePage = () => {
  const { success, error: showError } = useNotification();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    smsService.getParentContacts()
      .then((res) => setContacts(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load parent contacts', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handleSend = async (contact) => {
    const phone = contact.fatherPhone || contact.motherPhone || contact.guardianPhone;
    if (!phone || !draft.trim()) return;
    setSending(true);
    try {
      await smsService.sendToParent(contact.studentId, phone, draft.trim());
      success(`Message sent to ${contact.fatherName || contact.motherName || contact.guardianName || 'parent'} of ${contact.studentName}`, 'Message Sent');
      setDraft('');
      setActiveStudentId(null);
    } catch (err) {
      showError(err.message || 'Failed to send message', 'Send Failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-500" /> Parent Contact Directory
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          SCOMS has no separate parent-login portal — contact parents directly by phone, or send a real SMS below.
        </p>
      </div>

      {contacts.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">You have no assigned classes yet.</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => {
            const primaryPhone = c.fatherPhone || c.motherPhone || c.guardianPhone;
            const primaryName = c.fatherName || c.motherName || c.guardianName;
            return (
              <div key={c.studentId} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {primaryName || 'Parent/Guardian not on file'} — Parent of {c.studentName} ({c.section}, Roll {c.rollNumber})
                    </span>
                    {primaryPhone && <p className="text-slate-500 mt-0.5 font-mono">{primaryPhone}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {primaryPhone && (
                      <a href={`tel:${primaryPhone}`} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg hover:bg-emerald-100">
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setActiveStudentId(activeStudentId === c.studentId ? null : c.studentId)}
                      disabled={!primaryPhone}
                      className="px-3 py-1.5 font-bold text-white bg-sky-600 rounded-lg disabled:opacity-40"
                    >
                      Message
                    </button>
                  </div>
                </div>

                {activeStudentId === c.studentId && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type an SMS message..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                    <button
                      onClick={() => handleSend(c)}
                      disabled={sending || !draft.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentMessagePage;
