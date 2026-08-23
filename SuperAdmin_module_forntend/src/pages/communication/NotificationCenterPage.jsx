import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { Send, Bell, Settings, Radio, History } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const NotificationCenterPage = () => {
  const { success } = useNotification();
  const [broadcast, setBroadcast] = useState({
    target: 'ALL',
    subject: '',
    message: '',
    channels: {
      email: true,
      sms: false,
      push: true
    }
  });

  const history = [
    { id: 1, target: 'All Institutions', subject: 'System Maintenance - Aug 28', channels: 'Email, Push', status: 'Completed', date: '2026-08-22 10:00 AM' },
    { id: 2, target: 'Platform Admins', subject: 'Security Policy Updates', channels: 'Email', status: 'Completed', date: '2026-08-15 09:30 AM' },
    { id: 3, target: 'All Users', subject: 'Introducing AI Question Generator', channels: 'Push', status: 'Completed', date: '2026-08-10 11:15 AM' },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    success(`Broadcast message "${broadcast.subject}" successfully scheduled for dispatch!`);
    setBroadcast({
      target: 'ALL',
      subject: '',
      message: '',
      channels: { email: true, sms: false, push: true }
    });
  };

  const columns = [
    { header: 'Target Audience', key: 'target', render: (val) => <span className="font-bold">{val}</span> },
    { header: 'Subject / Banner', key: 'subject' },
    { header: 'Delivery Channels', key: 'channels' },
    { header: 'Date Dispatched', key: 'date', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Notification & Announcements" subtitle="Send platform-wide system alerts, maintenance updates and dashboard banner notices" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Radio className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Compose System Broadcast</h3>
          </div>
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Target Audience</label>
                <select 
                  value={broadcast.target} 
                  onChange={(e) => setBroadcast({ ...broadcast, target: e.target.value })} 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="ALL">All Portal Users (Admins, Staff, Students)</option>
                  <option value="INSTITUTE_ADMINS">Institute Admins Only</option>
                  <option value="STAFF">All Staff & Faculty</option>
                  <option value="STUDENTS">All Enrolled Students</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Delivery Channels</label>
                <div className="flex gap-4 items-center h-8">
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={broadcast.channels.email} 
                      onChange={(e) => setBroadcast({ ...broadcast, channels: { ...broadcast.channels, email: e.target.checked } })}
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={broadcast.channels.push} 
                      onChange={(e) => setBroadcast({ ...broadcast, channels: { ...broadcast.channels, push: e.target.checked } })}
                    />
                    <span>Push Alerts</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={broadcast.channels.sms} 
                      onChange={(e) => setBroadcast({ ...broadcast, channels: { ...broadcast.channels, sms: e.target.checked } })}
                    />
                    <span>SMS text</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Alert Headline / Subject</label>
              <input 
                type="text" 
                required
                value={broadcast.subject} 
                onChange={(e) => setBroadcast({ ...broadcast, subject: e.target.value })} 
                placeholder="e.g. Scheduled downtime for database upgrade"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Alert Content / Message Body</label>
              <textarea 
                required
                rows={4}
                value={broadcast.message} 
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })} 
                placeholder="Compose full broadcast message here..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              <span>Schedule Broadcast</span>
            </button>
          </form>
        </div>

        {/* Configurations Info */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Alert Center Policies</h3>
          </div>
          <div className="space-y-3 text-slate-500 leading-relaxed">
            <p>System announcements trigger live alerts on target modules dashboard notifications components.</p>
            <p className="font-bold text-slate-700 dark:text-slate-300">Rate Limiting Enforced:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>SMS broadcasts: Capped at 50,000 texts/day</li>
              <li>Push notifications: Unlimited delivery</li>
              <li>SMTP delivery: Throttle of 100 emails/min</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dispatch History */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Broadcast Audit Log</h3>
        </div>
        <DataTable columns={columns} data={history} />
      </div>
    </div>
  );
};

export default NotificationCenterPage;
