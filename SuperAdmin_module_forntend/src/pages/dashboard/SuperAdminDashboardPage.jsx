import React from 'react';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import { mockInstitutions } from '../../data/mockInstitutionsData';
import { mockBillingStats } from '../../data/mockBillingData';
import { mockAnalytics } from '../../data/mockAnalyticsData';
import {
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  LifeBuoy,
  Activity,
  Plus,
  CreditCard,
  UserPlus,
  Send,
  BarChart2,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Header */}
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden shadow-xl border-none">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">SCOMS Platform Control Center</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md">
                Multi-Tenant SaaS
              </span>
            </div>
            <p className="text-xs text-indigo-100 mt-1">
              Supervising <span className="font-bold text-white">5 Registered Institutions</span> across 4 Indian States.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/super-admin/institutions/new')}
              className="px-4 py-2 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Institution</span>
            </button>

            <button
              onClick={() => navigate('/super-admin/plans')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Create Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 13 KPI Cards Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Platform KPIs & Key Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Institutions"
            value="5"
            subtitle="Schools, Colleges, Univs"
            icon={Building2}
            color="indigo"
            onClick={() => navigate('/super-admin/institutions')}
          />
          <StatCard
            title="Active Institutions"
            value="4"
            subtitle="Paying Subscriptions"
            icon={Building2}
            color="emerald"
            badgeText="80%"
            onClick={() => navigate('/super-admin/institutions')}
          />
          <StatCard
            title="Trial Institutions"
            value="1"
            subtitle="Govt HSS Palakkad"
            icon={Clock}
            color="amber"
            onClick={() => navigate('/super-admin/subscriptions/trials')}
          />
          <StatCard
            title="Suspended Institutions"
            value="0"
            subtitle="Clean Compliance"
            icon={Building2}
            color="rose"
            onClick={() => navigate('/super-admin/institutions')}
          />
          <StatCard
            title="Total Users"
            value="15,400"
            subtitle="Across All Portals"
            icon={Users}
            color="sky"
            onClick={() => navigate('/super-admin/users')}
          />
          <StatCard
            title="Total Students"
            value="24,500"
            subtitle="Enrolled Students"
            icon={GraduationCap}
            color="purple"
          />
          <StatCard
            title="Total Staff"
            value="1,575"
            subtitle="Teaching & Non-Teaching"
            icon={Briefcase}
            color="indigo"
          />
          <StatCard
            title="Total Revenue"
            value="₹28.45 Lakhs"
            subtitle="Lifetime Platform Earnings"
            icon={DollarSign}
            color="emerald"
            onClick={() => navigate('/super-admin/invoices')}
          />
          <StatCard
            title="Monthly Recurring (MRR)"
            value="₹4.85 Lakhs"
            subtitle="+14% Month over Month"
            icon={TrendingUp}
            color="emerald"
            badgeText="+14%"
          />
          <StatCard
            title="Pending Payments"
            value="₹1.53 Lakhs"
            subtitle="1 Invoice Awaiting Settlement"
            icon={Receipt}
            color="amber"
          />
          <StatCard
            title="Support Tickets"
            value="3 Open"
            subtitle="Avg Response Time: 45m"
            icon={LifeBuoy}
            color="indigo"
            onClick={() => navigate('/super-admin/tickets')}
          />
          <StatCard
            title="System Health"
            value="99.98%"
            subtitle="All Gateways Operational"
            icon={Activity}
            color="emerald"
            onClick={() => navigate('/super-admin/system-health')}
          />
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Platform Analytics & Growth Trajectories
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Institution Growth Trajectory"
            subtitle="Monthly onboarded institutions"
            data={mockAnalytics.institutionGrowth}
            height={200}
          />
          <ChartCard
            title="Platform User Growth"
            subtitle="Active student, staff & admin accounts"
            data={mockAnalytics.userGrowth}
            height={200}
          />
          <ChartCard
            title="Monthly Recurring Revenue (INR ₹)"
            subtitle="SaaS subscription collections"
            data={mockAnalytics.revenueMonthly}
            height={200}
          />
          <ChartCard
            title="State-wise Distribution Ranking"
            subtitle="Tamil Nadu, Karnataka, Kerala, Maharashtra"
            height={200}
          />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
