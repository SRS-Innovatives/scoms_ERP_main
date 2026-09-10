import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { aiService } from '../../services/aiService';
import { Bot, Send, Sparkles, User, BookOpen, AlertTriangle } from 'lucide-react';

export const AiAssistantPage = () => {
  const { error: showError } = useNotification();
  const [topics, setTopics] = useState([]);
  const [classGrade, setClassGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I'm your SCOMS AI Study Tutor. Pick your class, subject and language below, then ask me anything from that chapter." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    aiService.getTopics()
      .then((res) => {
        const data = res.data || [];
        setTopics(data);
        if (data.length > 0) {
          setClassGrade(String(data[0].classGrade));
          setSubject(data[0].subject);
          setLanguage(data[0].language);
        }
      })
      .catch(() => {}); // non-critical — the chat still works without a matched topic, just less grounded
  }, []);

  const subjectsForClass = [...new Set(topics.filter((t) => String(t.classGrade) === classGrade).map((t) => t.subject))];
  const languagesForSubject = [...new Set(topics.filter((t) => String(t.classGrade) === classGrade && t.subject === subject).map((t) => t.language))];
  const classOptions = [...new Set(topics.map((t) => t.classGrade))].sort((a, b) => a - b);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = { sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    const question = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await aiService.askAiAssistant({ prompt: question, classGrade, subject, language });
      setMessages((prev) => [...prev, {
        sender: 'ai',
        text: res.data.answer,
        simulated: res.data.simulated,
        groundedInChapters: res.data.groundedInChapters,
      }]);
    } catch (err) {
      showError(err.message || 'Failed to get a response from the AI tutor', 'AI Tutor Unavailable');
      setMessages((prev) => prev.slice(0, -1)); // roll back the optimistic user message
      setPrompt(question);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="AI Study Tutor" subtitle="Ask a question grounded in your own class's textbook content — usage is logged for your institution." />

      {topics.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Class</label>
            <select value={classGrade} onChange={(e) => { setClassGrade(e.target.value); setSubject(''); setLanguage(''); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {classOptions.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select value={subject} onChange={(e) => { setSubject(e.target.value); setLanguage(''); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="">Select subject</option>
              {subjectsForClass.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <option value="">Select language</option>
              {languagesForSubject.map((l) => <option key={l} value={l}>{l === 'TAMIL' ? 'Tamil' : 'English'}</option>)}
            </select>
          </div>
        </div>
      )}

      {topics.length === 0 && (
        <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No textbook chapters have been uploaded yet — the tutor will still answer, but from general knowledge instead of your specific syllabus.
        </div>
      )}

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[480px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">SCOMS AI Tutor Bot</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">Online</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-xl text-white ${m.sender === 'user' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="max-w-md space-y-1.5">
                <div className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}>
                  {m.text}
                </div>
                {m.simulated && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">⚠ Simulated — ask your Institute Admin to have the AI provider configured</p>
                )}
                {m.groundedInChapters?.length > 0 && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> From: {m.groundedInChapters.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-xs text-slate-400 font-semibold italic">AI Tutor is generating answer...</div>}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question about your selected chapter..."
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs"
          />
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs">
            <Send className="w-4 h-4" /> Ask AI
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistantPage;
