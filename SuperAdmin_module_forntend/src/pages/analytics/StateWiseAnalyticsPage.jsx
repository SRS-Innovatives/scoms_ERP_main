import React, { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import ChartCard from '../../components/common/ChartCard';
import { Loader2 } from 'lucide-react';
import analyticsService from '../../services/analyticsService';

export const StateWiseAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getAnalytics()
      .then((res) => setAnalytics(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Rank', key: 'rank', render: (v) => <span className="font-black text-indigo-600">#{v}</span> },
    { header: 'State / Union Territory', key: 'state', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Registered Institutions', key: 'institutions', render: (v) => <span className="font-bold">{v}</span> },
    { header: 'Active Student Population', key: 'activeStudents', render: (v) => v.toLocaleString() },
    { header: 'State Revenue Share (INR)', key: 'revenue', render: (v) => `₹${v.toLocaleString()}` }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Indian State-wise SaaS Analytics" subtitle="Track regional penetration and revenue distribution across onboarded institutions." />
      <ChartCard title="State Geographic Distribution" subtitle="Institutions onboarded per state" data={analytics?.stateDistribution || []} height={220} color="violet" showTrend={false} />
      {(analytics?.stateBreakdown || []).length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No institutions onboarded yet.
        </div>
      ) : (
        <DataTable columns={columns} data={analytics.stateBreakdown} />
      )}
    </div>
  );
};

export default StateWiseAnalyticsPage;
