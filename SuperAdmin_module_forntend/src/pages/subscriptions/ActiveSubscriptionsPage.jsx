import React, { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2 } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';

export const ActiveSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.getSubscriptions()
      .then((res) => setSubscriptions(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Sub ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600">{v.slice(0, 8)}</span> },
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v?.name}</span> },
    { header: 'Plan Tier', key: 'plan', sortable: false, render: (v) => <span className="font-bold text-indigo-600">{v?.name}</span> },
    { header: 'Start Date', key: 'startDate', render: (v) => new Date(v).toLocaleDateString() },
    { header: 'Renewal Date', key: 'endDate', render: (v) => new Date(v).toLocaleDateString() },
    { header: 'Monthly Price', key: 'plan', sortable: false, render: (v) => `₹${v?.priceMonthly?.toLocaleString()}` },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Active & Trial Subscriptions" subtitle="Monitor active SaaS subscriptions, renewal dates, and trial expirations across tenant institutions." />
      {subscriptions.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No subscriptions recorded yet.
        </div>
      ) : (
        <DataTable columns={columns} data={subscriptions} />
      )}
    </div>
  );
};

export default ActiveSubscriptionsPage;
