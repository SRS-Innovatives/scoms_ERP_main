import React from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { mockSmsGateways } from '../../data/mockSmsData';
import { MessageSquare, CheckCircle, AlertTriangle, Send } from 'lucide-react';

export const SmsManagerPage = () => {
  const columns = [
    { header: 'Gateway Provider', key: 'name', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Sender ID / DLT', key: 'senderId', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Status', key: 'status', render: (v) => <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold text-xs">{v}</span> },
    { header: 'Remaining Balance', key: 'balance', render: (v) => <span className="font-bold">{v.toLocaleString()} Credits</span> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="SMS & Telecommunication Administration" subtitle="Monitor India DLT registered SMS gateways, credit allocations, and delivery logs." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SMS Sent" value={mockSmsGateways.smsSent.toLocaleString()} icon={MessageSquare} color="indigo" />
        <StatCard title="SMS Delivered" value={mockSmsGateways.smsDelivered.toLocaleString()} icon={CheckCircle} color="emerald" badgeText="98.7%" />
        <StatCard title="SMS Failed" value={mockSmsGateways.smsFailed.toLocaleString()} icon={AlertTriangle} color="rose" />
        <StatCard title="Platform SMS Balance" value={mockSmsGateways.smsBalance.toLocaleString()} icon={Send} color="sky" />
      </div>

      <DataTable columns={columns} data={mockSmsGateways.providers} />
    </div>
  );
};

export default SmsManagerPage;
