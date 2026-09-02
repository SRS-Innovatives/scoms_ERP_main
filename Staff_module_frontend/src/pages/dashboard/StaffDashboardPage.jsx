import React, { useEffect, useState } from 'react';
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionsPanel from '../../components/layout/QuickActionsPanel';
import PerformanceChart from '../../components/common/PerformanceChart';
import ScheduleTimeline from '../../components/common/ScheduleTimeline';
import AssignmentCard from '../../components/common/AssignmentCard';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  FileCheck,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';
import attendanceService from '../../services/attendanceService';
import assignmentService from '../../services/assignmentService';
import timetableService from '../../services/timetableService';
import studentLeaveService from '../../services/studentLeaveService';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const toCardShape = (a) => ({
  id: a.id,
  class: a.className,
  subject: a.subjectName,
  status: a.status,
  title: a.title,
  dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—',
  maxMarks: a.totalMarks,
  totalSubmissions: a._count?.submissions || 0,
  totalStudents: a._count?.submissions || 0,
});

export const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      profileService.getMyProfile(),
      attendanceService.getMyClasses(),
      attendanceService.getHistory(),
      assignmentService.getAssignments(),
      timetableService.getMyTimetable(),
      profileService.getMyLeaves(),
      studentLeaveService.getStudentLeaves(),
    ])
      .then(([profileRes, classesRes, historyRes, assignmentsRes, timetableRes, leavesRes, studentLeavesRes]) => {
        setProfile(profileRes.data);
        setMyClasses(classesRes.data || []);
        setAttendanceHistory(historyRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setTimetable(timetableRes.data || []);
        setLeaves(leavesRes.data?.leaves || []);
        setPendingLeaves((studentLeavesRes.data || []).filter((l) => l.status === 'PENDING'));
      })
      .catch((err) => showError(err.message || 'Failed to load dashboard', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  const todayName = DAY_NAMES[new Date().getDay()];
  const todaysEntries = timetable.filter((e) => e.dayOfWeek === todayName);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const todaySchedule = todaysEntries.map((e) => {
    const [startH, startM] = e.startTime.split(':').map(Number);
    const [endH, endM] = e.endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const status = nowMinutes >= endMin ? 'Completed' : nowMinutes >= startMin ? 'Ongoing' : 'Upcoming';
    return {
      time: `${e.startTime} - ${e.endTime}`,
      status,
      isCurrent: status === 'Ongoing',
      subject: e.subject?.name || e.label || 'Free Period',
      class: e.timetable?.section?.name || '—',
      period: `Period ${e.period}`,
      room: e.roomNumber || '—',
    };
  });

  const todayHistory = attendanceHistory.filter((h) => new Date(h.date).toDateString() === new Date().toDateString());
  const submissionsToReview = assignments.reduce((sum, a) => sum + (a._count?.submissions || 0), 0);
  const pendingLeaveCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeaveCount = leaves.filter((l) => l.status === 'APPROVED').length;

  const weeklyAttendanceData = (() => {
    const byDay = {};
    attendanceHistory.slice(0, 30).forEach((h) => {
      const day = new Date(h.date).toLocaleDateString(undefined, { weekday: 'short' });
      if (!byDay[day]) byDay[day] = { total: 0, present: 0 };
      byDay[day].total += h.totalStudents || 0;
      byDay[day].present += h.presentCount || 0;
    });
    return Object.entries(byDay).map(([label, v]) => ({ label, value: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0, target: 100 }));
  })();

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white relative overflow-hidden shadow-xl border-none">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 shadow-md flex items-center justify-center text-xl font-bold">
              {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">Welcome back, {profile?.firstName} {profile?.lastName}! 👋</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md">
                  {profile?.department?.name || 'No Department'}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-1">
                {profile?.designation} • Employee ID: <span className="font-mono">{profile?.employeeCode}</span>
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

      <QuickActionsPanel onOpenCompose={() => {}} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Today's Classes"
          value={todaysEntries.length}
          subtitle={`${todaySchedule.filter((s) => s.status === 'Completed').length} Completed • ${todaySchedule.filter((s) => s.status !== 'Completed').length} Remaining`}
          icon={CalendarCheck}
          color="sky"
          onClick={() => navigate('/staff/timetable/daily')}
        />
        <DashboardCard
          title="Attendance Sessions Today"
          value={todayHistory.length}
          subtitle={`Across ${new Set(todayHistory.map((h) => h.section)).size} section(s)`}
          icon={CheckCircle}
          color="emerald"
          onClick={() => navigate('/staff/attendance/take')}
        />
        <DashboardCard
          title="Submissions to Review"
          value={submissionsToReview}
          subtitle={`Across ${assignments.length} assignment(s)`}
          icon={FileCheck}
          color="amber"
          onClick={() => navigate('/staff/assignments/list')}
        />
        <DashboardCard
          title="My Leave Requests"
          value={pendingLeaveCount}
          subtitle={`Pending • ${approvedLeaveCount} Approved`}
          icon={Clock}
          color="purple"
          onClick={() => navigate('/staff/leave/history')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {todaySchedule.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No classes scheduled for today.
            </div>
          ) : (
            <ScheduleTimeline schedules={todaySchedule} />
          )}
        </div>

        <div className="space-y-6">
          <PerformanceChart title="Recent Attendance Taken %" height={180} data={weeklyAttendanceData} />

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-500" />
                Student Leave Requests
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {pendingLeaves.length} Pending
              </span>
            </div>

            {pendingLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No pending leave requests.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {pendingLeaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{l.student?.firstName} {l.student?.lastName} ({l.student?.section?.name})</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{l.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No assignments created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.slice(0, 3).map((asn) => (
              <AssignmentCard
                key={asn.id}
                assignment={toCardShape(asn)}
                onEvaluateClick={(a) => navigate(`/staff/assignments/evaluate?id=${a.id}`)}
                onViewDetails={(a) => navigate(`/staff/assignments/details?id=${a.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboardPage;
