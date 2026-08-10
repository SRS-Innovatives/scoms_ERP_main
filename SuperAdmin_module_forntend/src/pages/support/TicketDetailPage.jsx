import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { mockSupportTickets } from '../../data/mockSupportData';
import { useNotification } from '../../context/NotificationContext';
import { Send, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success } = useNotification();
  const tck = mockSupportTickets.find(t => t.id === id) || mockSupportTickets[0];

  const [messages, setMessages] = useState([
    { sender: tck.user, role: 'Institute Admin', text: tck.subject, time: tck.createdDate },
    { sender: 'Priya Sharma', role: 'Support Agent', text: 'Hello! I am reviewing your request regarding tax breakdowns. We have updated the SAC 998313 invoice generator rules.', time: '2026-08-10 11:35 AM' }
  ]);
  const [replyText, setReplyText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setMessages(prev => [...prev, { sender: 'Super Admin', role: 'Super Admin', text: replyText, time: new Date().toLocaleTimeString() }]);
    setReplyText('');
    success('Reply transmitted to institute admin.', 'Message Sent');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/super-admin/tickets')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back to Ticket Queue
      </button>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-indigo-600">{tck.id}</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{tck.subject}</h2>
            <p className="text-xs text-slate-500">{tck.institution} • Category: {tck.category}</p>
          </div>
          <StatusBadge status={tck.status} />
        </div>

        {/* Conversation Thread */}
        <div className="space-y-3 py-2 max-h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-4 rounded-2xl max-w-xl text-xs ${msg.role === 'Super Admin' ? 'ml-auto bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
              <div className="flex justify-between items-center mb-1 text-[10px] opacity-80">
                <span className="font-bold">{msg.sender} ({msg.role})</span>
                <span>{msg.time}</span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Reply Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t pt-4">
          <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type official response..." className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl" />
          <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetailPage;
