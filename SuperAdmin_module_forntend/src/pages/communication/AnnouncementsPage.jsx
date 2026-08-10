import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/common/FormInput';
import Select from '../../components/common/Select';
import { useNotification } from '../../context/NotificationContext';
import { Send, Megaphone } from 'lucide-react';

export const AnnouncementsPage = () => {
  const { success } = useNotification();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('All Institutions');
  const [message, setMessage] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    success(`Platform announcement "${title}" broadcasted to ${target}!`, 'Broadcast Dispatched');
    setTitle('');
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Platform System Broadcasts" subtitle="Send immediate in-app, SMS & email notifications across tenant institutions." />

      <form onSubmit={handleBroadcast} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <FormInput label="Announcement Title" required value={title} onChange={setTitle} placeholder="e.g. Scheduled System Upgrade Maintenance Notice" />
        <Select label="Target Institution Group" value={target} onChange={setTarget} options={[{ value: 'All Institutions', label: 'All Registered Institutions' }, { value: 'Schools Only', label: 'Schools Only' }, { value: 'Colleges Only', label: 'Colleges Only' }]} />
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Broadcast Message Content</label>
          <textarea rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type announcement details..." className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"></textarea>
        </div>
        <button type="submit" className="w-full py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> Broadcast Announcement Now
        </button>
      </form>
    </div>
  );
};

export default AnnouncementsPage;
