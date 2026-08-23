import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { CalendarRange, ShieldAlert, CreditCard, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const RenewalManagementPage = () => {
  const { success } = useNotification();

  const renewals = [
    { id: 1, name: 'Delhi Public School', plan: 'Enterprise Custom', expiry: '2026-09-15', daysLeft: 24, status: 'Expiring Soon' },
    { id: 2, name: 'St. Xavier Higher Secondary', plan: 'Growth Pro', expiry: '2026-09-22', daysLeft: 31, status: 'Active' },
    { id: 3, name: 'Palakkad Science College', plan: 'Enterprise Custom', expiry: '2026-09-28', daysLeft: 37, status: 'Active' },
    { id: 4, name: 'Greenwood High School', plan: 'Basic Tier', expiry: '2026-08-20', daysLeft: 0, status: 'Expired' },
  ];

  const handleRemind = (name) => {
    success(`Renewal invoice remainder email sent to administrator at: ${name}`);
  };

  const columns = [
    { header: 'Institution Name', key: 'name', render: (val) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Subscription Plan', key: 'plan', render: (val) => <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Expiry Date', key: 'expiry', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      header: 'Time Remaining', 
      key: 'daysLeft', 
      render: (val) => (
        <span className={`font-bold ${val === 0 ? 'text-rose-600' : val <= 30 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
          {val === 0 ? 'Expired' : `${val} Days Remaining`}
        </span>
      ) 
    },
    { 
      header: 'Renewal Status', 
      key: 'status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'Active' ? 'bg-emerald-50 text-emerald-700' : val === 'Expiring Soon' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
          {val}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'name',
      render: (name, row) => (
        <button 
          disabled={row.status === 'Active'}
          onClick={() => handleRemind(name)} 
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all ${row.status === 'Active' ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-750'}`}
        >
          Dispatch Reminder
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Subscription Renewals & Retention" subtitle="Monitor contract expiry schedules, manage auto-renewal alerts and follow up on expired plans" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Total Subscribers" value="5 accounts" subtitle="SaaS Contracts active" icon={CreditCard} color="indigo" />
        <StatCard title="Expiring (30 Days)" value="2 accounts" subtitle="Awaiting renewal cycle" icon={Clock} color="amber" />
        <StatCard title="Expired Accounts" value="1 account" subtitle="Greenwood High School" icon={ShieldAlert} color="rose" />
        <StatCard title="Average Renewal Rate" value="94.2%" subtitle="Industry Leading" icon={CalendarRange} color="emerald" />
      </div>

      {/* Renewals Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Subscription Renewals Calendar</h3>
        <DataTable columns={columns} data={renewals} />
      </div>
    </div>
  );
};

export default RenewalManagementPage;
