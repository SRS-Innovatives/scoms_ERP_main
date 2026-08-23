import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Mail, Settings, ShieldCheck, AlertCircle, Play, CheckCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const EmailManagerPage = () => {
  const { success } = useNotification();
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: 'notifications@scoms.in',
    encryption: 'TLS',
  });

  const [testEmail, setTestEmail] = useState('');

  const logs = [
    { id: 1, recipient: 'principal@srstech.edu.in', subject: 'Welcome to SCOMS - Onboarding', status: 'Delivered', date: '2026-08-22 03:14 PM' },
    { id: 2, recipient: 'sunil@gamil.com', subject: 'Institute Onboarding - Activated', status: 'Delivered', date: '2026-08-22 02:45 PM' },
    { id: 3, recipient: 'arun.kumar@student.dpis.edu.in', subject: 'Your Student Account Credentials', status: 'Delivered', date: '2026-08-22 01:10 PM' },
    { id: 4, recipient: 'teacher@dpis-delhi.edu.in', subject: 'Your Staff Account Credentials', status: 'Delivered', date: '2026-08-22 11:30 AM' },
    { id: 5, recipient: 'parent.kumar@dpis.edu.in', subject: 'Parent Login Activation Link', status: 'Failed', date: '2026-08-22 10:15 AM' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    success('SMTP configurations updated successfully!');
  };

  const handleTest = (e) => {
    e.preventDefault();
    success(`Test email dispatched to ${testEmail}! Check mailbox.`);
    setTestEmail('');
  };

  const columns = [
    { header: 'Recipient', key: 'recipient', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'Subject', key: 'subject' },
    { header: 'Date & Time', key: 'date', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Delivered' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Email Server Configuration" subtitle="Configure platform SMTP gateways and audit mail dispatch logs" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="SMTP Connection" value="Active" subtitle="smtp.gmail.com" icon={ShieldCheck} color="emerald" />
        <StatCard title="Total Mails Sent" value="14,240" subtitle="This Month" icon={Mail} color="indigo" />
        <StatCard title="Delivery Rate" value="99.8%" subtitle="High Reputation" icon={CheckCircle} color="emerald" />
        <StatCard title="Bounce Rate" value="0.2%" subtitle="Under Threshold" icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">SMTP Server Configuration</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Host</label>
              <input 
                type="text" 
                value={smtpConfig.host} 
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Port</label>
              <input 
                type="text" 
                value={smtpConfig.port} 
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Username</label>
              <input 
                type="email" 
                value={smtpConfig.user} 
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Encryption Protocol</label>
              <select 
                value={smtpConfig.encryption} 
                onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="TLS">STARTTLS (Port 587)</option>
                <option value="SSL">SSL / TLS (Port 465)</option>
                <option value="None">None (Port 25)</option>
              </select>
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Save Email Settings
              </button>
            </div>
          </form>
        </div>

        {/* Test Email Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Play className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Send Test Email</h3>
          </div>
          <form onSubmit={handleTest} className="space-y-4 text-xs">
            <p className="text-slate-500">Dispatch a mock email to verify SMTP gateway connection credentials.</p>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Recipient Address</label>
              <input 
                type="email" 
                required 
                value={testEmail} 
                onChange={(e) => setTestEmail(e.target.value)} 
                placeholder="developer@example.com" 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <button type="submit" className="w-full py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              Dispatch Test Message
            </button>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">SMTP Activity Audit Trail</h3>
        <DataTable columns={columns} data={logs} />
      </div>
    </div>
  );
};

export default EmailManagerPage;
