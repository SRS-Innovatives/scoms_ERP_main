import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ChartCard from '../../components/common/ChartCard';
import { mockIndianStates } from '../../data/mockIndianStates';
import { MapPin, Trophy } from 'lucide-react';

export const StateWiseAnalyticsPage = () => {
  const columns = [
    { header: 'Rank', key: 'rank', render: (v) => <span className="font-black text-indigo-600">#{v}</span> },
    { header: 'State / Union Territory', key: 'state', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Registered Institutions', key: 'institutions', render: (v) => <span className="font-bold">{v}</span> },
    { header: 'Active Student Population', key: 'activeStudents', render: (v) => v.toLocaleString() },
    { header: 'State Revenue Share (INR)', key: 'revenue', render: (v) => `₹${v.toLocaleString()}` }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Indian State-wise SaaS Analytics" subtitle="Track regional penetration, state education board compliance, and revenue distributions." />
      <ChartCard title="State Geographic Distribution" subtitle="Top performing educational hubs in India" height={220} />
      <DataTable columns={columns} data={mockIndianStates} />
    </div>
  );
};

export default StateWiseAnalyticsPage;
