import React from 'react';
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionsPanel from '../../components/layout/QuickActionsPanel';
import PerformanceChart from '../../components/common/PerformanceChart';
import ScheduleTimeline from '../../components/common/ScheduleTimeline';
import AssignmentCard from '../../components/common/AssignmentCard';
import {
  mockDashboardStats,
  mockTodaySchedule,
  mockAssignments,
  mockStaffProfile
} from '../../data/mockStaffData';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  FileCheck,
  GraduationCap,
  Sparkles,
  Users,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white relative overflow-hidden shadow-xl border-none">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={mockStaffProfile.avatar}
              alt={mockStaffProfile.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">Welcome back, {mockStaffProfile.name}! 👋</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md">
                  {mockStaffProfile.department}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-1">
                {mockStaffProfile.designation} • Employee ID: <span className="font-mono">{mockStaffProfile.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/staff/attendance/take')}
              className="px-4 py-2 text-xs font-bold text-sky-900 bg-white hover:bg-sky-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Take Class Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <QuickActionsPanel onOpenCompose={() => {}} />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Today Classes"
          value={mockDashboardStats.todayClassesCount}
          subtitle="2 Completed • 2 Upcoming"
          icon={CalendarCheck}
          color="sky"
          onClick={() => navigate('/staff/timetable/daily')}
        />
        <DashboardCard
          title="Attendance Taken"
          value={`${mockDashboardStats.attendanceTakenCount} / 4`}
          subtitle="1 Class Attendance Pending"
          icon={CheckCircle}
          color="emerald"
          badgeText="75%"
          onClick={() => navigate('/staff/attendance/take')}
        />
        <DashboardCard
          title="Pending Grading"
          value={mockDashboardStats.pendingAssignmentsGrading}
          subtitle="Physics Ray Optics Homework"
          icon={FileCheck}
          color="amber"
          onClick={() => navigate('/staff/assignments/evaluate')}
        />
        <DashboardCard
          title="Leave Balance"
          value={`${mockDashboardStats.leaveBalanceDays} Days`}
          subtitle="CL: 8 • EL: 13 • ML: 9"
          icon={Clock}
          color="purple"
          onClick={() => navigate('/staff/leave/balance')}
        />
      </div>

      {/* Timeline & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Timeline (2 Cols) */}
        <div className="lg:col-span-2">
          <ScheduleTimeline schedules={mockTodaySchedule} />
        </div>

        {/* Analytics Charts & Doubt Messages */}
        <div className="space-y-6">
          <PerformanceChart title="Weekly Attendance Taken %" height={180} />

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                Student Doubts & Queries
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                5 Pending
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Aarav Patel (Class 12-A)</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  "Sir, please clarify Q4 in Electrostatics assignment before tomorrow."
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Ananya Sen (Class 12-A)</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  "When will the practical lab log marks be updated?"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Assignments Row */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Assignments & Submissions
          </h4>
          <button
            onClick={() => navigate('/staff/assignments/list')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            View All Assignments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAssignments.slice(0, 3).map((asn) => (
            <AssignmentCard
              key={asn.id}
              assignment={asn}
              onEvaluateClick={() => navigate('/staff/assignments/evaluate')}
              onViewDetails={() => navigate('/staff/assignments/details')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
