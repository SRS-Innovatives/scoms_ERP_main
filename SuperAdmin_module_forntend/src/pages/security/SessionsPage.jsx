import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Users, Globe, Monitor, ShieldAlert, Trash2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const SessionsPage = () => {
  const { success } = useNotification();

  const sessions = [
    { id: 1, email: 'suresh68167@gmail.com', role: 'INSTITUTE_ADMIN', ip: '103.45.68.10', device: 'Chrome / Windows 11', time: '2026-08-22 09:15 PM' },
    { id: 2, email: 'sunil@gamil.com', role: 'INSTITUTE_ADMIN', ip: '122.180.34.22', device: 'Firefox / macOS Sequoia', time: '2026-08-22 08:44 PM' },
    { id: 3, email: 'superadmin@scoms.edu.in', role: 'SUPER_ADMIN', ip: '106.220.45.189', device: 'Chrome / Windows 10', time: '2026-08-22 07:10 PM' },
    { id: 4, email: 'teacher@dpis-delhi.edu.in', role: 'TEACHER', ip: '103.11.23.40', device: 'Safari / iPhone 15 Pro', time: '2026-08-22 04:12 PM' },
    { id: 5, email: 'arun.kumar@student.dpis.edu.in', role: 'STUDENT', ip: '120.44.89.62', device: 'Chrome / Android 14', time: '2026-08-22 03:05 PM' },
  ];

  const handleRevoke = (email) => {
    success(`Revoked all active sessions for user: ${email}`);
  };

  const columns = [
    { header: 'User Email Address', key: 'email', render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Assigned Role', key: 'role', render: (val) => <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">{val}</span> },
    { header: 'IP Address', key: 'ip', render: (val) => <code className="bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-xs text-indigo-500">{val}</code> },
    { header: 'Device / Web Browser', key: 'device' },
    { header: 'Login Timestamp', key: 'time', render: (val) => <span className="font-mono text-xs">{val}</span> },
    {
      header: 'Actions',
      key: 'email',
      render: (email) => (
        <button onClick={() => handleRevoke(email)} title="Revoke Session" className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-600">
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Active Platform Sessions" subtitle="Monitor and manage all active user sessions currently logged into any SCOMS module" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Active Sessions" value="1,450" subtitle="Across all portals" icon={Users} color="indigo" />
        <StatCard title="Desktop Clients" value="830 Users" subtitle="Chrome, Firefox, Edge" icon={Monitor} color="indigo" />
        <StatCard title="Mobile Clients" value="620 Users" subtitle="Safari, Chrome Mobile" icon={Globe} color="indigo" />
        <StatCard title="Suspicious Sessions" value="0 Alerts" subtitle="No anomalies flagged" icon={ShieldAlert} color="emerald" />
      </div>

      {/* Sessions list */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Active User Sessions Log</h3>
        <DataTable columns={columns} data={sessions} />
      </div>
    </div>
  );
};

export default SessionsPage;
