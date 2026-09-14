import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import { DollarSign, TrendingUp, CreditCard, Building2, Loader2 } from 'lucide-react';
import analyticsService from '../../services/analyticsService';

const TIER_COLORS = ['bg-indigo-600', 'bg-purple-600', 'bg-amber-600', 'bg-emerald-600', 'bg-sky-600'];

const formatLakhs = (amount) => `₹${(amount / 100000).toFixed(2)} Lakhs`;

export const RevenueAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getAnalytics()
      .then((res) => setAnalytics(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Revenue & Financial Analytics" subtitle="Monitor Monthly Recurring Revenue (MRR), lifetime SaaS billings, and plan-tier breakdown" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Total Platform Billings" value={formatLakhs(analytics.totalBillings)} subtitle="Lifetime paid invoices" icon={DollarSign} color="emerald" />
        <StatCard title="Current Month Revenue" value={formatLakhs(analytics.currentMonthRevenue)} subtitle="This billing cycle" icon={TrendingUp} color="emerald" />
        <StatCard title="Average Account Value" value={formatLakhs(analytics.avgAccountValue)} subtitle="Per onboarded institution" icon={CreditCard} color="indigo" />
        <StatCard title="Paying Institutions" value={analytics.activeInstitutions} subtitle={`of ${analytics.totalInstitutions} onboarded`} icon={Building2} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Recurring Revenue (INR ₹)"
          subtitle="Paid invoice collections by month"
          data={analytics.revenueMonthly}
          height={220}
          color="emerald"
        />
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Revenue Tier Breakdown</h3>
          <p className="text-slate-500 mb-4">Share of lifetime revenue contributed by each subscription plan.</p>
          {analytics.revenueByPlan.length === 0 ? (
            <p className="text-slate-400">No paid invoices recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {analytics.revenueByPlan.map((tier, idx) => (
                <div key={tier.plan}>
                  <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                    <span>{tier.plan}</span>
                    <span>{formatLakhs(tier.amount)} ({tier.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${TIER_COLORS[idx % TIER_COLORS.length]} h-full rounded-full`} style={{ width: `${tier.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalyticsPage;
