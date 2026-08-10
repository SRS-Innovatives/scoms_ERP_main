import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { mockStaffProfile, mockNotifications } from '../../data/mockStaffData';
import {
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ sidebarOpen, setSidebarOpen, onOpenCompose }) => {
  const { isDark, toggleTheme } = useTheme();
  const { info } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = mockNotifications.filter(n => n.unread).length;

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

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    {unreadCount} Unread
                  </span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        info(notif.message, notif.title);
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</h5>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{notif.message}</p>
                    </div>
                  ))}
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
              <img
                src={mockStaffProfile.avatar}
                alt={mockStaffProfile.name}
                className="w-8 h-8 rounded-xl object-cover border border-sky-300 dark:border-sky-700"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{mockStaffProfile.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{mockStaffProfile.designation}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 bg-white dark:bg-slate-900">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{mockStaffProfile.email}</p>
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
