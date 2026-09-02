import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import ChartCard from '../../components/common/ChartCard';
import analyticsService from '../../services/analyticsService';
import billingService from '../../services/billingService';
import supportService from '../../services/supportService';
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
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [billingStats, setBillingStats] = useState(null);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, billingRes, ticketsRes] = await Promise.all([
          analyticsService.getAnalytics(),
          billingService.getBillingStats(),
          supportService.getTickets()
        ]);
        if (analyticsRes?.data) {
          setAnalytics(analyticsRes.data);
        }
        if (billingRes?.data) {
          setBillingStats(billingRes.data);
        }
        if (ticketsRes?.data) {
          setOpenTicketsCount(ticketsRes.data.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalInst = analytics?.totalInstitutions ?? 0;
  const activeInst = analytics?.activeInstitutions ?? 0;
  const trialInst = analytics?.trialInstitutions ?? 0;
  const suspendedInst = analytics?.suspendedInstitutions ?? 0;
  const totalUsers = analytics?.totalUsers?.toLocaleString() ?? '0';
  const totalStudents = analytics?.totalStudents?.toLocaleString() ?? '0';
  const totalStaff = analytics?.totalStaff?.toLocaleString() ?? '0';
  const systemHealth = analytics ? `${analytics.systemHealth}%` : '0.00%';

  const totalRevenue = billingStats
    ? `₹${(billingStats.totalRevenue / 100000).toFixed(2)} Lakhs`
    : '₹0.00 Lakhs';
  const mrr = billingStats
    ? `₹${(billingStats.mrr / 100000).toFixed(2)} Lakhs`
    : '₹0.00 Lakhs';
  const pendingRevenue = billingStats
    ? `₹${(billingStats.pendingRevenue / 100000).toFixed(2)} Lakhs`
    : '₹0.00 Lakhs';

  const activePercentage = totalInst > 0 ? `${Math.round((activeInst / totalInst) * 100)}%` : '0%';

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
            <p className="text-xs text-black mt-1">
              Supervising <span className="font-bold">{totalInst} Registered Institutions</span> across India.
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

      {/* 12 KPI Cards Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Platform KPIs & Key Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-up" style={{ '--delay': '0ms' }}>
            <StatCard
              title="Total Institutions"
              value={totalInst}
              subtitle="Schools, Colleges, Univs"
              icon={Building2}
              color="indigo"
              onClick={() => navigate('/super-admin/institutions')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '40ms' }}>
            <StatCard
              title="Active Institutions"
              value={activeInst}
              subtitle="Paying Subscriptions"
              icon={Building2}
              color="emerald"
              badgeText={activePercentage}
              onClick={() => navigate('/super-admin/institutions')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '80ms' }}>
            <StatCard
              title="Trial Institutions"
              value={trialInst}
              subtitle="Trial Accounts Active"
              icon={Clock}
              color="amber"
              onClick={() => navigate('/super-admin/subscriptions/trials')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '120ms' }}>
            <StatCard
              title="Suspended Institutions"
              value={suspendedInst}
              subtitle="Clean Compliance"
              icon={Building2}
              color="rose"
              onClick={() => navigate('/super-admin/institutions')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '160ms' }}>
            <StatCard
              title="Total Users"
              value={totalUsers}
              subtitle="Across All Portals"
              icon={Users}
              color="sky"
              onClick={() => navigate('/super-admin/users')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '200ms' }}>
            <StatCard
              title="Total Students"
              value={totalStudents}
              subtitle="Enrolled Students"
              icon={GraduationCap}
              color="purple"
              onClick={() => navigate('/super-admin/users?group=student')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '240ms' }}>
            <StatCard
              title="Total Staff"
              value={totalStaff}
              subtitle="Teaching & Non-Teaching"
              icon={Briefcase}
              color="indigo"
              onClick={() => navigate('/super-admin/users?group=staff')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '280ms' }}>
            <StatCard
              title="Total Revenue"
              value={totalRevenue}
              subtitle="Lifetime Platform Earnings"
              icon={DollarSign}
              color="emerald"
              onClick={() => navigate('/super-admin/invoices')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '320ms' }}>
            <StatCard
              title="Monthly Recurring (MRR)"
              value={mrr}
              subtitle="Current Month Collections"
              icon={TrendingUp}
              color="emerald"
              onClick={() => navigate('/super-admin/subscriptions')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '360ms' }}>
            <StatCard
              title="Pending Payments"
              value={pendingRevenue}
              subtitle={`${billingStats?.overdueInvoices || 0} Overdue Invoices`}
              icon={Receipt}
              color="amber"
              onClick={() => navigate('/super-admin/invoices')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '400ms' }}>
            <StatCard
              title="Support Tickets"
              value={`${openTicketsCount} Open`}
              subtitle="Open or In Progress"
              icon={LifeBuoy}
              color="indigo"
              onClick={() => navigate('/super-admin/tickets')}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '440ms' }}>
            <StatCard
              title="System Health"
              value={systemHealth}
              subtitle="All Gateways Operational"
              icon={Activity}
              color="emerald"
              onClick={() => navigate('/super-admin/system-health')}
            />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Platform Analytics & Growth Trajectories
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-up" style={{ '--delay': '0ms' }}>
            <ChartCard
              title="Institution Growth Trajectory"
              subtitle="Monthly onboarded institutions"
              data={analytics?.institutionGrowth || []}
              height={200}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '80ms' }}>
            <ChartCard
              title="Platform User Growth"
              subtitle="Active student, staff & admin accounts"
              data={analytics?.userGrowth || []}
              height={200}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '160ms' }}>
            <ChartCard
              title="Monthly Recurring Revenue (INR ₹)"
              subtitle="SaaS subscription collections"
              data={analytics?.revenueMonthly || []}
              height={200}
            />
          </div>
          <div className="animate-fade-up" style={{ '--delay': '240ms' }}>
            <ChartCard
              title="State-wise Distribution Ranking"
              subtitle="By institution state location"
              data={analytics?.stateDistribution || []}
              height={200}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
