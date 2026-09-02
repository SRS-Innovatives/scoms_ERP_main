import React, { useState, useEffect, useCallback } from 'react';
import SummaryCard from '../../components/common/SummaryCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import dashboardService from '../../services/dashboardService';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  GraduationCap,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getDashboard();
      setData(res.data);
    } catch (err) {
      showError(err.message || 'Failed to load dashboard data', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const studentColumns = [
    {
      header: 'Student',
      key: 'name',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-tight">{val}</p>
          <p className="text-[10px] text-slate-400 font-mono">Roll: {row.rollNo || '—'}</p>
        </div>
      )
    },
    { header: 'Course', key: 'course' },
    { header: 'Section', key: 'section' },
    {
      header: 'Fee Status',
      key: 'feeStatus',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (val) => <span className="font-medium">{val || '—'}</span>
    }
  ];

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {loading ? 'Loading dashboard...' : 'No dashboard data available.'}
        </p>
      </div>
    );
  }

  const departmentChartData = data.departmentDistribution.map((d) => ({ name: d.department, count: d.count }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> SCOMS Institute Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Here is your daily operational summary for <span className="font-bold">{data.institution?.name}</span>. You have{' '}
              <span className="font-bold text-amber-300">{data.totalStudents - data.todayAttendance.present} absent students</span> and{' '}
              <span className="font-bold text-white">₹{(data.pendingFees.amount / 100000).toFixed(2)} Lakhs</span> pending fees today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin/fee/collect')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Fees</span>
            </button>
            <button
              onClick={() => navigate('/admin/student/admission')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-white/20 font-bold text-xs rounded-xl backdrop-blur-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Admission</span>
            </button>
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Absent SMS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Enrolled Students"
          value={data.totalStudents.toLocaleString()}
          subtitle={`Across ${data.totalDepartments} Departments`}
          icon={GraduationCap}
          color="indigo"
        />
        <SummaryCard
          title="Teaching & Non-Teaching Staff"
          value={data.totalStaff}
          subtitle="Total registered staff"
          icon={Users}
          color="sky"
        />
        <SummaryCard
          title="Today's Attendance Rate"
          value={`${data.todayAttendance.rate}%`}
          subtitle={`${data.todayAttendance.present} / ${data.todayAttendance.total} Present`}
          icon={CheckCircle}
          color="emerald"
        />
        <SummaryCard
          title="Pending Fee Outstanding"
          value={`₹${(data.pendingFees.amount / 100000).toFixed(2)} L`}
          subtitle={`${data.pendingFees.studentsOverdue} Students Overdue`}
          icon={CreditCard}
          color="rose"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly Fee Collection Trend (INR)"
            subtitle={`Calendar Year ${new Date().getFullYear()} Fee Receipts`}
            type="bar"
            data={data.monthlyCollection}
            height={260}
          />
        </div>
        <div>
          <ChartCard
            title="Department Student Distribution"
            subtitle="Current Active Enrollment Breakdown"
            type="pie"
            data={departmentChartData}
            height={260}
          />
        </div>
      </div>

      {/* Middle Row: Recent Admissions & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Student Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Newly registered students</p>
            </div>
            <button
              onClick={() => navigate('/admin/student/list')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <DataTable columns={studentColumns} data={data.recentStudents} pageSize={5} />
        </div>

        {/* Institutional Circulars & Notice Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notice Board & Announcements</h3>
            <button
              onClick={() => navigate('/admin/communication/announcements')}
              className="text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              Post Notice
            </button>
          </div>

          <div className="space-y-3">
            {data.announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No announcements posted yet.</p>
            ) : (
              data.announcements.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {item.targetRole}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SMS Compose Modal */}
      <SMSComposeModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} defaultRecipientType="absentees" />
    </div>
  );
};

export default DashboardPage;
