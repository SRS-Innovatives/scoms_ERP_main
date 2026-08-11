import React from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { mockTodaySchedule, mockAssignments, mockExams } from '../../data/mockStudentData';
import {
  Clock,
  GraduationCap,
  Calendar,
  FileText,
  CreditCard,
  BookOpen,
  Sparkles,
  Video,
  ChevronRight,
  TrendingUp,
  Award,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboardPage = () => {
  const { student } = useStudentAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Student Profile Hero Header */}
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden shadow-xl border-none">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={student?.photo}
              alt={student?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
                  {student?.admissionNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950">
                  {student?.status}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">{student?.name}</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {student?.course} • {student?.department} ({student?.semester}, Sec {student?.section})
              </p>
              <p className="text-[11px] text-indigo-200 mt-0.5">
                Class Teacher: <span className="font-semibold text-white">{student?.classTeacher}</span>
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

      {/* 8 Dashboard KPI Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Academic Overview & Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Attendance"
            value={`${student?.attendancePercentage}%`}
            subtitle="Overall Semester Attendance"
            icon={Clock}
            color="emerald"
            badgeText="Good"
            onClick={() => navigate('/student/attendance')}
          />
          <StatCard
            title="Current GPA"
            value={student?.gpa}
            subtitle="Rank #4 in Department"
            icon={Award}
            color="indigo"
            badgeText="Semester 4"
            onClick={() => navigate('/student/results')}
          />
          <StatCard
            title="Pending Homework"
            value="1 Task"
            subtitle="Process Scheduling Algo"
            icon={FileText}
            color="amber"
            onClick={() => navigate('/student/assignments')}
          />
          <StatCard
            title="Upcoming Exams"
            value="3 Exams"
            subtitle="Starts Aug 25th"
            icon={Calendar}
            color="rose"
            onClick={() => navigate('/student/exams')}
          />
          <StatCard
            title="Fee Balance"
            value="₹10,000"
            subtitle="Due by Aug 31st"
            icon={CreditCard}
            color="amber"
            onClick={() => navigate('/student/fees')}
          />
          <StatCard
            title="Today's Classes"
            value="4 Classes"
            subtitle="2 Completed • 2 Left"
            icon={GraduationCap}
            color="sky"
            onClick={() => navigate('/student/timetable')}
          />
          <StatCard
            title="Library Books"
            value="2 Borrowed"
            subtitle="Due Aug 15th & 20th"
            icon={BookOpen}
            color="purple"
            onClick={() => navigate('/student/library')}
          />
          <StatCard
            title="Unread Notices"
            value="2 Alerts"
            subtitle="Exam Schedule Published"
            icon={Bell}
            color="indigo"
            onClick={() => navigate('/student/announcements')}
          />
        </div>
      </div>

      {/* Quick Action Tiles Bar */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Quick Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {[
            { label: 'Attendance', path: '/student/attendance', color: 'bg-emerald-500' },
            { label: 'Timetable', path: '/student/timetable', color: 'bg-indigo-500' },
            { label: 'Submit Homework', path: '/student/assignments', color: 'bg-amber-500' },
            { label: 'View Results', path: '/student/results', color: 'bg-purple-500' },
            { label: 'Pay Fees', path: '/student/fees/pay', color: 'bg-rose-500' },
            { label: 'Materials', path: '/student/materials', color: 'bg-sky-500' },
            { label: 'Practice Tests', path: '/student/practice-tests', color: 'bg-indigo-600' },
            { label: 'AI Assistant', path: '/student/ai', color: 'bg-gradient-to-r from-indigo-600 to-purple-600' }
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

      {/* Today's Schedule & Upcoming Deadlines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Schedule Timeline (2 Columns) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today's Class Schedule</h3>
              <p className="text-[11px] text-slate-500">Live timetable with virtual class meeting links</p>
            </div>
            <button
              onClick={() => navigate('/student/timetable')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Weekly Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {mockTodaySchedule.map((cls) => (
              <div
                key={cls.period}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs shrink-0">
                    P{cls.period}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{cls.subject}</h4>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{cls.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Teacher: <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.teacher}</span> • Room: {cls.room}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      {cls.startTime} - {cls.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <StatusBadge status={cls.status} size="sm" />
                  {cls.onlineLink && (
                    <a
                      href={cls.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Class
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments & Upcoming Exams Sidebar Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pending Homework</h3>
              <button onClick={() => navigate('/student/assignments')} className="text-xs font-bold text-indigo-600">View All</button>
            </div>

            <div className="space-y-3 text-xs">
              {mockAssignments.filter(a => a.status === 'Pending').map((asn) => (
                <div key={asn.id} className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{asn.title}</h4>
                    <StatusBadge status={asn.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500">{asn.subject} • Due: <span className="font-bold text-rose-600">{asn.dueDate}</span></p>
                  <button
                    onClick={() => navigate('/student/assignments')}
                    className="w-full py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                  >
                    Submit Assignment Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
