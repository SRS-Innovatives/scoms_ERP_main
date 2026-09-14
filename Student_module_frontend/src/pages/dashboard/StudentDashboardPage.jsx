import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Clock,
  GraduationCap,
  Calendar,
  FileText,
  CreditCard,
  BookOpen,
  Sparkles,
  ChevronRight,
  Award,
  Bell,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../../services/attendanceService';
import timetableService from '../../services/timetableService';
import examService from '../../services/examService';
import feeService from '../../services/feeService';
import announcementService from '../../services/announcementService';
import assignmentService from '../../services/assignmentService';
import campusService from '../../services/campusService';

const TODAY_NAME = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

export const StudentDashboardPage = () => {
  const { student } = useStudentAuth();
  const { error: showError } = useNotification();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [examSchedule, setExamSchedule] = useState([]);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [libraryIssues, setLibraryIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      attendanceService.getAttendance().catch(() => ({ data: null })),
      timetableService.getTimetable().catch(() => ({ data: [] })),
      examService.getExamSchedule().catch(() => ({ data: [] })),
      examService.getResults().catch(() => ({ data: [] })),
      feeService.getFees().catch(() => ({ data: [] })),
      announcementService.getAll().catch(() => ({ data: [] })),
      assignmentService.getAssignments().catch(() => ({ data: [] })),
      campusService.getMyLibrary().catch(() => ({ data: [] })),
    ]).then(([attRes, ttRes, examRes, resultsRes, feeRes, annRes, assignRes, libRes]) => {
      setAttendance(attRes.data);
      setTimetable(ttRes.data || []);
      setExamSchedule(examRes.data || []);
      setResults(resultsRes.data || []);
      setFees(feeRes.data || []);
      setAnnouncements(annRes.data || []);
      setAssignments(assignRes.data || []);
      setLibraryIssues(libRes.data || []);
    }).catch((err) => showError(err.message || 'Failed to load dashboard', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const todaysClasses = useMemo(() => timetable.filter((e) => e.dayOfWeek === TODAY_NAME).sort((a, b) => a.period - b.period), [timetable]);

  const { completedCount, upcomingCount } = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let completed = 0;
    todaysClasses.forEach((e) => {
      const [h, m] = e.endTime.split(':').map(Number);
      if (h * 60 + m <= nowMinutes) completed++;
    });
    return { completedCount: completed, upcomingCount: todaysClasses.length - completed };
  }, [todaysClasses]);

  const gpa = useMemo(() => {
    if (results.length === 0) return null;
    const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const totalMax = results.reduce((sum, r) => sum + r.examSchedule.maxMarks, 0);
    if (totalMax === 0) return null;
    return ((totalObtained / totalMax) * 10).toFixed(2);
  }, [results]);

  const upcomingExamCount = useMemo(() => examSchedule.filter((e) => new Date(e.examDate) >= new Date()).length, [examSchedule]);
  const pendingHomeworkCount = useMemo(() => assignments.filter((a) => !a.mySubmission).length, [assignments]);
  const issuedBookCount = useMemo(() => libraryIssues.filter((i) => !i.returnedAt).length, [libraryIssues]);
  const totalFeeDue = useMemo(() => fees.reduce((sum, a) => sum + a.dueAmount, 0), [fees]);
  const nearestFeeDueDate = useMemo(() => {
    const dates = fees.filter((a) => a.dueAmount > 0).map((a) => new Date(a.feeStructure?.dueDate));
    return dates.length > 0 ? new Date(Math.min(...dates)) : null;
  }, [fees]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = student?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Student Profile Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden shadow-xl border-none">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border-2 border-white/40 shadow-lg shrink-0">
              {student?.name ? `${student.name[0]}${student.name.split(' ')[1]?.[0] || ''}` : '..'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
                  {student?.admissionNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950">
                  {student?.status}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-semibold mt-2">{greeting}, {firstName} 👋</p>
              <h2 className="text-xl sm:text-2xl font-black mt-0.5">{student?.name}</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {student?.course} • {student?.department} ({student?.semester}, Sec {student?.section})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/student/ai')}
              className="px-4 py-2 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Study Assistant</span>
            </button>

            <button
              onClick={() => navigate('/student/id-card')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition-all"
            >
              View Digital ID
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards — real, computed from live data */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Academic Overview & Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Attendance"
            value={attendance ? `${attendance.percentage}%` : '—'}
            subtitle={attendance ? `${attendance.presentCount} / ${attendance.totalClasses} classes` : 'No records yet'}
            icon={Clock}
            color="emerald"
            badgeText={attendance && attendance.percentage >= 75 ? 'Good' : attendance ? 'Low' : undefined}
            onClick={() => navigate('/student/attendance')}
          />
          <StatCard
            title="Current GPA"
            value={gpa || '—'}
            subtitle={gpa ? 'Computed from published results' : 'No published results yet'}
            icon={Award}
            color="indigo"
            onClick={() => navigate('/student/results')}
          />
          <StatCard
            title="Pending Homework"
            value={`${pendingHomeworkCount}`}
            subtitle={pendingHomeworkCount === 0 ? 'All caught up!' : `${pendingHomeworkCount} awaiting submission`}
            icon={FileText}
            color="amber"
            badgeText={pendingHomeworkCount > 0 ? 'Due' : undefined}
            onClick={() => navigate('/student/assignments')}
          />
          <StatCard
            title="Upcoming Exams"
            value={`${upcomingExamCount} Exam${upcomingExamCount === 1 ? '' : 's'}`}
            subtitle={examSchedule.length > 0 ? examSchedule[0].exam?.name : 'None scheduled'}
            icon={Calendar}
            color="rose"
            onClick={() => navigate('/student/exams')}
          />
          <StatCard
            title="Fee Balance"
            value={`₹${totalFeeDue.toLocaleString()}`}
            subtitle={nearestFeeDueDate ? `Due by ${nearestFeeDueDate.toLocaleDateString('en-IN')}` : 'Nothing due'}
            icon={CreditCard}
            color="amber"
            onClick={() => navigate('/student/fees')}
          />
          <StatCard
            title="Today's Classes"
            value={`${todaysClasses.length} Classes`}
            subtitle={`${completedCount} Completed • ${upcomingCount} Left`}
            icon={GraduationCap}
            color="sky"
            onClick={() => navigate('/student/timetable')}
          />
          <StatCard
            title="Library Books"
            value={`${issuedBookCount}`}
            subtitle={issuedBookCount === 0 ? 'None issued' : `${issuedBookCount} currently with you`}
            icon={BookOpen}
            color="purple"
            onClick={() => navigate('/student/library')}
          />
          <StatCard
            title="Announcements"
            value={`${announcements.length} Notice${announcements.length === 1 ? '' : 's'}`}
            subtitle={announcements[0]?.title || 'Nothing new'}
            icon={Bell}
            color="indigo"
            onClick={() => navigate('/student/announcements')}
          />
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today's Class Schedule</h3>
              <p className="text-[11px] text-slate-500">{TODAY_NAME.charAt(0) + TODAY_NAME.slice(1).toLowerCase()}'s timetable</p>
            </div>
            <button
              onClick={() => navigate('/student/timetable')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Weekly Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaysClasses.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todaysClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs shrink-0">
                      P{cls.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{cls.subject?.name || cls.label || 'Free Period'}</h4>
                        {cls.subject?.code && <span className="font-mono text-[10px] text-indigo-600 font-bold">{cls.subject.code}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cls.staff?.user?.email ? <>Teacher: <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.staff.user.email}</span> • </> : ''}Room: {cls.roomNumber || '—'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                        {cls.startTime} - {cls.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Tiles */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Attendance', path: '/student/attendance', color: 'bg-emerald-500' },
                { label: 'Timetable', path: '/student/timetable', color: 'bg-indigo-500' },
                { label: 'View Results', path: '/student/results', color: 'bg-purple-500' },
                { label: 'Pay Fees', path: '/student/fees/pay', color: 'bg-rose-500' },
                { label: 'Exam Schedule', path: '/student/exams', color: 'bg-sky-500' },
                { label: 'AI Assistant', path: '/student/ai', color: 'bg-gradient-to-r from-indigo-600 to-purple-600' },
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(act.path)}
                  className="glass-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center font-bold text-slate-800 dark:text-slate-200"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${act.color} mb-1.5`}></span>
                  <span className="truncate w-full text-[11px]">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
