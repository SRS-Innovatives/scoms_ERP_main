import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import { mockAnalytics } from '../../data/mockAnalyticsData';
import { Users, Building2, Cpu, Activity } from 'lucide-react';

export const PlatformAnalyticsPage = () => {
  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Platform Growth & Utilization Analytics" subtitle="Deep dive into active institutions, active user demographics, and module utilization metrics" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Active Institutions" value="4 / 5" subtitle="80% Conversion Rate" icon={Building2} color="emerald" />
        <StatCard title="Monthly Active Users" value="12,450" subtitle="80.8% Engagement Rate" icon={Users} color="indigo" />
        <StatCard title="API Ingress Load" value="2.45M Req" subtitle="99.98% Health Check" icon={Activity} color="emerald" />
        <StatCard title="Core Micro-services" value="12 Active" subtitle="All Systems Operational" icon={Cpu} color="indigo" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Institution Growth Trajectory"
          subtitle="Monthly onboarded schools & colleges"
          data={mockAnalytics.institutionGrowth}
          height={220}
        />
        <ChartCard
          title="Active Portal User Growth"
          subtitle="Students, staff & parent accounts active log"
          data={mockAnalytics.userGrowth}
          height={220}
        />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Module Engagement Breakdown</h3>
        <p className="text-slate-500 mb-4">Track which platform services have the highest active engagement rate across all institutions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Core Academics & Grading</h4>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">92%</span>
            <p className="text-[10px] text-slate-500">Most utilized service module platform-wide.</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-855 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Fees & Online Collections</h4>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">78%</span>
            <p className="text-[10px] text-slate-500">Processing payments & invoicing monthly.</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-855 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Transport & GPS Live Fleet</h4>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">45%</span>
            <p className="text-[10px] text-slate-500">Actively deployed in 2 core institutions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalyticsPage;
