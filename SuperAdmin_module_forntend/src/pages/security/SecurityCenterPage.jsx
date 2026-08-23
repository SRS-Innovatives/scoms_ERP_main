import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { ShieldCheck, ShieldAlert, Key, Settings, Lock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const SecurityCenterPage = () => {
  const { success } = useNotification();
  const [mfaRequired, setMfaRequired] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState(8);

  const threatLogs = [
    { id: 1, event: 'Brute Force Attempt Blocked', ip: '198.162.1.45', location: 'Russia, Moscow', severity: 'Critical', date: '2026-08-22 04:30 PM' },
    { id: 2, event: 'SQL Ingestion Attempt Blocked', ip: '45.89.230.12', location: 'Ukraine, Kiev', severity: 'Critical', date: '2026-08-21 11:20 PM' },
    { id: 3, event: 'Excessive API Rate Exceeded', ip: '103.45.68.221', location: 'India, Chennai', severity: 'Medium', date: '2026-08-21 02:40 PM' },
    { id: 4, event: 'Suspicious Admin Login', ip: '82.102.3.89', location: 'USA, New York', severity: 'High', date: '2026-08-20 09:12 AM' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    success('Security policies saved successfully!');
  };

  const columns = [
    { header: 'Threat Event', key: 'event', render: (val) => <span className="font-bold text-rose-600 dark:text-rose-400">{val}</span> },
    { header: 'IP Address', key: 'ip', render: (val) => <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs">{val}</code> },
    { header: 'Location / Origin', key: 'location' },
    { 
      header: 'Severity', 
      key: 'severity',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Critical' ? 'bg-rose-100 text-rose-850' : val === 'High' ? 'bg-amber-100 text-amber-850' : 'bg-slate-100 text-slate-700'}`}>
          {val}
        </span>
      )
    },
    { header: 'Timestamp', key: 'date', render: (val) => <span className="font-mono text-xs text-slate-500">{val}</span> }
  ];

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Security & Firewall Center" subtitle="Manage platform authentication policies, session lifetimes, and view active firewall threat reports" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Security Status" value="Secured" subtitle="All Systems Normal" icon={ShieldCheck} color="emerald" />
        <StatCard title="Blocked Threats" value="14 Events" subtitle="Last 24 Hours" icon={ShieldAlert} color="rose" />
        <StatCard title="Active SSL Certificate" value="Valid" subtitle="Expires in 280 Days" icon={ShieldCheck} color="emerald" />
        <StatCard title="MFA Enrollment" value="84%" subtitle="Active Platform Users" icon={Key} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Settings */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">System Security Parameters</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Enforce Multi-Factor Authentication</label>
              <select 
                value={mfaRequired ? 'true' : 'false'} 
                onChange={(e) => setMfaRequired(e.target.value === 'true')} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="true">Required for all Admins & Staff</option>
                <option value="false">Optional</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Minimum Password Length</label>
              <input 
                type="number" 
                value={minPasswordLength} 
                onChange={(e) => setMinPasswordLength(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Password Complexity Rule</label>
              <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <option value="strong">Letters, Numbers, Symbols (Strong)</option>
                <option value="medium">Alphanumeric (Medium)</option>
                <option value="basic">Standard (Basic)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Session Inactivity Timeout (Mins)</label>
              <input type="number" defaultValue="30" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Apply Policies
              </button>
            </div>
          </form>
        </div>

        {/* Security Summary */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Security Actions</h3>
          </div>
          <div className="space-y-2">
            <button onClick={() => success('Initiated full platform system vulnerability scan...')} className="w-full py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl animate-pulse">
              Initiate Vulnerability Scan
            </button>
            <button onClick={() => success('Cleared all blocked IP lists successfully!')} className="w-full py-2 font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl">
              Flush Blocked IP Lists
            </button>
          </div>
        </div>
      </div>

      {/* Threat Logs Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Firewall Access Block Log</h3>
        <DataTable columns={columns} data={threatLogs} />
      </div>
    </div>
  );
};

export default SecurityCenterPage;
