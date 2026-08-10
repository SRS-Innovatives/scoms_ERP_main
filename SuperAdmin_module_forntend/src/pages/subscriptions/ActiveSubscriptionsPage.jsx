import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockSubscriptions } from '../../data/mockSubscriptionsData';

export const ActiveSubscriptionsPage = () => {
  const columns = [
    { header: 'Sub ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Institution', key: 'institution', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Plan Tier', key: 'plan', render: (v) => <span className="font-bold text-indigo-600">{v}</span> },
    { header: 'Start Date', key: 'startDate' },
    { header: 'Renewal Date', key: 'endDate' },
    { header: 'Amount', key: 'amount', render: (v) => `₹${v.toLocaleString()}` },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Active & Trial Subscriptions" subtitle="Monitor active SaaS subscriptions, renewal dates, and trial expirations across tenant institutions." />
      <DataTable columns={columns} data={mockSubscriptions} />
    </div>
  );
};

export default ActiveSubscriptionsPage;
