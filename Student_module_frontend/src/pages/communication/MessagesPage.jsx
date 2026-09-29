import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Send, User, Loader2, MessageSquareOff } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import messageService from '../../services/messageService';
import ErrorState from '../../components/common/ErrorState';

export const MessagesPage = () => {
  const { error: showError } = useNotification();
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadTeachers = useCallback(() => {
    setLoading(true);
    setError(false);
    messageService.getTeachers()
      .then((res) => {
        const data = res.data || [];
        setTeachers(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((err) => { showError(err.message || 'Failed to load teachers', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const loadConversation = useCallback(() => {
    if (!selected) return;
    messageService.getConversation(selected.userId)
      .then((res) => setMessages(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load conversation', 'Load Failed'));
  }, [selected, showError]);

  useEffect(() => { loadConversation(); }, [loadConversation]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !selected) return;
    setSending(true);
    try {
      await messageService.send(selected.userId, msg);
      setMsg('');
      loadConversation();
    } catch (err) {
      showError(err.message || 'Failed to send message', 'Send Failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadTeachers} />;
  }

  if (teachers.length === 0) {
    return (
      <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <MessageSquareOff className="w-8 h-8 text-slate-300" /> No teachers assigned to your section yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Teacher Chat & Messages" subtitle="Direct communication with subject faculty who teach your section." />

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row h-[560px] overflow-hidden">
        {/* Teacher list */}
        <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0">
          {teachers.map((t) => (
            <button
              key={t.userId}
              onClick={() => setSelected(t)}
              className={`w-full text-left p-3 text-xs border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 ${
                selected?.userId === t.userId ? 'bg-indigo-50 dark:bg-indigo-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{t.subject} • {t.designation}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs">
            Chatting with {selected?.name}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center pt-10">No messages yet — say hello!</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.senderId !== selected.userId ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-md ${m.senderId !== selected.userId ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                    {m.content}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type message to teacher..."
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs"
            />
            <button type="submit" disabled={sending} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-50">
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
