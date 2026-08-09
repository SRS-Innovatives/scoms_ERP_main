import React, { useState } from 'react';
import SummaryCard from '../../components/common/SummaryCard';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import {
  dashboardStats,
  chartData,
  studentsList,
  feeTransactions,
  announcements
} from '../../data/mockData';
import {
  Users,
  GraduationCap,
  CheckCircle,
  CreditCard,
  TrendingUp,
  Award,
  BookOpen,
  UserPlus,
  Send,
  Plus,
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [showSmsModal, setShowSmsModal] = useState(false);

  const studentColumns = [
    {
      header: 'Student',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={val} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{val}</p>
            <p className="text-[10px] text-slate-400 font-mono">Roll: {row.rollNo}</p>
          </div>
        </div>
      )
    },
    { header: 'Course & Dept', key: 'course' },
    { header: 'Sem / Sec', key: 'yearSem' },
    {
      header: 'Fee Status',
      key: 'feeStatus',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (val) => <span className="font-medium">{val}</span>
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> SCOMS Institute Admin Portal 2025-26
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, Principal Dr. S. K. Rajan 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Here is your daily operational summary for Sri Ramakrishna College. You have <span className="font-bold text-amber-300">48 absent students</span> and <span className="font-bold text-white">₹18.45 Lakhs</span> pending fees today.
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
          value={dashboardStats.totalStudents.toLocaleString()}
          subtitle="Across 18 Branches"
          icon={GraduationCap}
          trend="+12% YoY"
          trendType="up"
          color="indigo"
        />
        <SummaryCard
          title="Teaching & Non-Teaching Staff"
          value={dashboardStats.totalStaff}
          subtitle="42 Professors, 36 Assoc Prof"
          icon={Users}
          trend="100% Present"
          trendType="up"
          color="sky"
        />
        <SummaryCard
          title="Today's Attendance Rate"
          value={`${dashboardStats.todayAttendance}%`}
          subtitle="3,270 / 3,450 Present"
          icon={CheckCircle}
          trend="-1.2% vs yesterday"
          trendType="down"
          color="emerald"
        />
        <SummaryCard
          title="Pending Fee Outstanding"
          value={`₹${(dashboardStats.pendingFees / 100000).toFixed(2)} L`}
          subtitle="142 Students Overdue"
          icon={CreditCard}
          trend="Due in 15 Days"
          trendType="down"
          color="rose"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly Fee Collection Trend (INR)"
            subtitle="Academic Year 2025-26 Fee Head Receipts"
            type="bar"
            data={chartData.monthlyCollection}
            height={260}
          />
        </div>
        <div>
          <ChartCard
            title="Department Student Distribution"
            subtitle="Current Active Batch Breakdown"
            type="pie"
            data={chartData.departmentStudents}
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Newly registered students for Even Semester 2025-26</p>
            </div>
            <button
              onClick={() => navigate('/admin/student/list')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <DataTable columns={studentColumns} data={studentsList.slice(0, 4)} pageSize={4} />
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
            {announcements.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.publishDate}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{item.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SMS Compose Modal */}
      <SMSComposeModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} defaultRecipientType="absentees" />
    </div>
  );
};

export default DashboardPage;
