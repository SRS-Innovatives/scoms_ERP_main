import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import studentLeaveService from '../../services/studentLeaveService';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Menu,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export const Navbar = ({ sidebarOpen, setSidebarOpen, onOpenCompose }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { info } = useNotification();
  const { profile, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);

  useEffect(() => {
    studentLeaveService.getStudentLeaves()
      .then((res) => setPendingLeaves((res.data || []).filter((l) => l.status === 'PENDING')))
      .catch(() => setPendingLeaves([]));
  }, []);

  const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` : '..';

  return (
    <header className="sticky top-0 z-30 glass-nav border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Toggle Sidebar & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              S
            </span>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                SCOMS <span className="text-sky-600 dark:text-sky-400 font-semibold text-xs">Staff Portal</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">School College Management System</p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, classes, question bank, materials..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2">
          {/* Quick Message Button */}
          <button
            onClick={onOpenCompose}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Notice</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {pendingLeaves.length > 0 && (
            <button
              onClick={() => navigate('/staff/leave/student-approvals')}
              title={`${pendingLeaves.length} pending leave approval(s)`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-200 dark:border-amber-900"
            >
              {pendingLeaves.length} Pending Leave{pendingLeaves.length > 1 ? 's' : ''}
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {profile?.user?.avatar ? (
                <img src={profile.user.avatar} alt={initials} className="w-8 h-8 rounded-xl object-cover border border-sky-300 dark:border-sky-700" />
              ) : (
                <span className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs border border-sky-300 dark:border-sky-700">
                  {initials}
                </span>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{profile?.designation}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 bg-white dark:bg-slate-900">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{profile?.firstName} {profile?.lastName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{profile?.user?.email}</p>
                </div>

                <Link
                  to="/staff/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-sky-500" /> My Profile
                </Link>

                <Link
                  to="/staff/profile/password"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-500" /> Account Settings
                </Link>

                <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    info('Logged out safely from SCOMS Staff Portal.');
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
