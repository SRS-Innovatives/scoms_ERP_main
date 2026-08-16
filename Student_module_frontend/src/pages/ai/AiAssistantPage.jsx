import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { aiService } from '../../services/aiService';
import { Bot, Send, Sparkles, User } from 'lucide-react';

export const AiAssistantPage = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello Arun! I am your SCOMS AI Campus Tutor. Ask me anything about your syllabus (CS8401 OS, CS8403 DBMS), code debugging, or exam study plans!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    const res = await aiService.askAiAssistant(prompt);
    setIsLoading(false);
    setMessages(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="AI Campus Study Tutor" subtitle="Powered by Gemini & SCOMS AI Engine for instant concept explanations." />

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[520px]">
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
              <div className={`p-4 rounded-2xl max-w-md leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}>
                {m.text}
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
            placeholder="Ask AI concept question (e.g. Explain Round Robin CPU scheduling algorithm)..."
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
