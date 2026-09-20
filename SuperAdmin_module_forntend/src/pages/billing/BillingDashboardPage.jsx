import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../../components/common/StatCard';
import InvoicesPage from './InvoicesPage';
import billingService from '../../services/billingService';
import { IndianRupee, Clock, AlertTriangle, Receipt, Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

export const BillingDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    setError(false);
    billingService.getBillingStats()
      .then((res) => setStats(res.data))
      .catch((err) => { console.error('Failed to load billing stats', err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState title="Failed to load billing stats" onRetry={loadStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue (Paid)"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            subtitle={`GST collected: ₹${(stats?.totalGstCollected ?? 0).toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="emerald"
          />
          <StatCard
            title="Pending Revenue"
            value={`₹${(stats?.pendingRevenue ?? 0).toLocaleString('en-IN')}`}
            subtitle="Awaiting payment"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Overdue Invoices"
            value={stats?.overdueInvoices ?? 0}
            subtitle={`₹${(stats?.overdueRevenue ?? 0).toLocaleString('en-IN')} at risk`}
            icon={AlertTriangle}
            color="rose"
          />
          <StatCard
            title="This Month"
            value={`₹${(stats?.mrr ?? 0).toLocaleString('en-IN')}`}
            subtitle={`${stats?.totalInvoices ?? 0} invoices total`}
            icon={Receipt}
            color="indigo"
          />
        </div>
      )}

      <InvoicesPage />
    </div>
  );
};

export default BillingDashboardPage;
