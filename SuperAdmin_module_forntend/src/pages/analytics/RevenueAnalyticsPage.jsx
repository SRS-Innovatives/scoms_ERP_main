import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import { mockAnalytics } from '../../data/mockAnalyticsData';
import { DollarSign, TrendingUp, CreditCard, ShieldAlert } from 'lucide-react';

export const RevenueAnalyticsPage = () => {
  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Revenue & Financial Analytics" subtitle="Monitor Monthly Recurring Revenue (MRR), Lifetime SaaS Billings, and Tier conversions" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Total Platform Billings" value="₹28.45 Lakhs" subtitle="Lifetime Collections" icon={DollarSign} color="emerald" />
        <StatCard title="Monthly Recurring (MRR)" value="₹4.85 Lakhs" subtitle="August billing cycle" icon={TrendingUp} color="emerald" />
        <StatCard title="Average Account Value" value="₹1.20 Lakhs" subtitle="Annual Contract Value" icon={CreditCard} color="indigo" />
        <StatCard title="Payment Churn Rate" value="0.5%" subtitle="Extremely High Retention" icon={ShieldAlert} color="emerald" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Recurring Revenue (INR ₹)"
          subtitle="SaaS subscription collection curves"
          data={mockAnalytics.revenueMonthly}
          height={220}
        />
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Revenue Tier Breakdown</h3>
          <p className="text-slate-500 mb-4">Percentage of total platform revenue contributions by plan tier category.</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>Enterprise Custom Tier (2 Institutions)</span>
                <span>₹16.5 Lakhs (58%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>Growth Pro Tier (2 Institutions)</span>
                <span>₹10.42 Lakhs (37%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '37%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>Basic Tier (1 Institution)</span>
                <span>₹1.53 Lakhs (5%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalyticsPage;
