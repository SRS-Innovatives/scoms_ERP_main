import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import announcementService from '../../services/announcementService';
import {
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Menu,
  QrCode
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Topbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { student, logout } = useStudentAuth();
  const { info } = useNotification();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    announcementService.getAll()
      .then((res) => setAnnouncements((res.data || []).slice(0, 10)))
      .catch(() => setAnnouncements([]));
  }, []);

  const initials = student ? `${student.name?.[0] || ''}${student.name?.split(' ')[1]?.[0] || ''}` : '..';

  return (
    <header className="sticky top-0 z-30 glass-nav border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4 min-w-0">
        {/* Left: Sidebar Toggle & Student Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block min-w-0 max-w-[260px]">
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-none truncate">
              {student?.institution || 'Loading...'}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {student?.course}{student?.semester ? ` • ${student.semester}` : ''}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects, assignments, exams, study materials..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Digital QR ID Card Quick Link */}
          <button
            onClick={() => navigate('/student/id-card')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-all"
          >
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Digital ID Card</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Dropdown — real institution announcements */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {announcements.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Campus Alerts & Notices</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {announcements.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                  {announcements.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No announcements yet.</p>
                  ) : (
                    announcements.map((anc) => (
                      <div
                        key={anc.id}
                        onClick={() => {
                          info(anc.content, anc.title);
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold text-slate-800 dark:text-slate-200">{anc.title}</h5>
                          <span className="text-[10px] text-slate-400">{new Date(anc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{anc.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs border border-indigo-400">
                {initials}
              </span>
              <div className="hidden lg:block text-left max-w-[140px]">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{student?.name}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">{student?.admissionNo}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 bg-white dark:bg-slate-900">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{student?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{student?.email}</p>
                </div>

                <Link
                  to="/student/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-500" /> My Academic Profile
                </Link>

                <Link
                  to="/student/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-500" /> Preferences & Security
                </Link>

                <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    navigate('/student/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Student Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
