import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import { Users, Building2, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import analyticsService from '../../services/analyticsService';

export const PlatformAnalyticsPage = () => {
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

  const conversionRate = analytics.totalInstitutions > 0 ? Math.round((analytics.activeInstitutions / analytics.totalInstitutions) * 100) : 0;

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Platform Growth & Utilization Analytics" subtitle="Deep dive into active institutions, active user demographics, and module utilization metrics" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Active Institutions" value={`${analytics.activeInstitutions} / ${analytics.totalInstitutions}`} subtitle={`${conversionRate}% of onboarded institutions`} icon={Building2} color="emerald" />
        <StatCard title="Total Platform Users" value={analytics.totalUsers.toLocaleString()} subtitle="All roles across every institution" icon={Users} color="indigo" />
        <StatCard title="Total Students" value={analytics.totalStudents.toLocaleString()} subtitle="Enrolled across the platform" icon={GraduationCap} color="emerald" />
        <StatCard title="Total Staff" value={analytics.totalStaff.toLocaleString()} subtitle="Employed across the platform" icon={Briefcase} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Institution Growth Trajectory"
          subtitle="Monthly onboarded schools & colleges"
          data={analytics.institutionGrowth}
          height={220}
          color="indigo"
        />
        <ChartCard
          title="Active Portal User Growth"
          subtitle="Students, staff & parent accounts created per month"
          data={analytics.userGrowth}
          height={220}
          color="amber"
        />
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Module Adoption Across Institutions</h3>
        <p className="text-slate-500 mb-4">Percentage of onboarded institutions with each module enabled.</p>
        {analytics.moduleAdoption.length === 0 ? (
          <p className="text-slate-400">No institutions onboarded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {analytics.moduleAdoption.slice(0, 3).map((m) => (
              <div key={m.key} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">{m.label}</h4>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{m.percentage}%</span>
                <p className="text-[10px] text-slate-500">{m.enabledCount} of {analytics.totalInstitutions} institutions.</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformAnalyticsPage;
