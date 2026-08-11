import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Send, User } from 'lucide-react';

export const MessagesPage = () => {
  const [msg, setMsg] = useState('');
  const [chats, setChats] = useState([
    { sender: 'teacher', name: 'Dr. Malathi S. (Class Teacher)', text: 'Arun, please submit your OS Round Robin simulation code before Friday 5:00 PM.' },
    { sender: 'student', name: 'Arun Kumar', text: 'Sure Ma\'am! Working on the Python script. Will submit by tomorrow afternoon.' }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setChats([...chats, { sender: 'student', name: 'Arun Kumar', text: msg }]);
    setMsg('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Teacher Chat & Messages" subtitle="Direct communication with HOD, Class Teacher, and Subject Faculty." />

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs">
          Chatting with Dr. Malathi S. (HOD CS)
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {chats.map((c, i) => (
            <div key={i} className={`flex flex-col ${c.sender === 'student' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-slate-400 font-bold mb-1">{c.name}</span>
              <div className={`p-3 rounded-2xl max-w-md ${c.sender === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                {c.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type message to teacher..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs"
          />
          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1">
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessagesPage;
