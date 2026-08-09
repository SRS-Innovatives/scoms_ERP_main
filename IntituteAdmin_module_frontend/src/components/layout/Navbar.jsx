import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  User,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { instituteInfo } from '../../data/mockData';

export const Navbar = ({ onToggleSidebar, onToggleMobile }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifyInfo } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInstituteMenu, setShowInstituteMenu] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(instituteInfo.shortName);

  const notificationsList = [
    { id: 1, title: 'Fee Payment Received', desc: 'REC/2025/04921 - Rs 46,000 paid by Kavitha R.', time: '5 mins ago', type: 'success' },
    { id: 2, title: 'Exam Registration Form', desc: '142 new exam forms submitted for Sem 6', time: '20 mins ago', type: 'info' },
    { id: 3, title: 'Absentees Alert', desc: '48 students absent today. SMS ready for broadcast.', time: '1 hr ago', type: 'warning' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between no-print">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search (Student, Staff, Fee...)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Institute Switcher */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowInstituteMenu(!showInstituteMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{selectedInstitute}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showInstituteMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 text-xs z-50 animate-scale-up">
              <p className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Switch Institution</p>
              <button
                onClick={() => {
                  setSelectedInstitute('SRCET (Engineering)');
                  setShowInstituteMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                SRCET (Engineering & Tech)
              </button>
              <button
                onClick={() => {
                  setSelectedInstitute('SRCAS (Arts & Science)');
                  setShowInstituteMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                SRCAS (Arts & Science College)
              </button>
              <button
                onClick={() => {
                  setSelectedInstitute('SRK Public School (CBSE)');
                  setShowInstituteMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                SRK Public School (CBSE)
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-xs z-50 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Notifications (3)</h4>
                <button className="text-[10px] text-indigo-600 font-semibold hover:underline">Mark all read</button>
              </div>

              <div className="space-y-2">
                {notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                      <span className="text-[9px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
              alt="Admin"
              className="w-8 h-8 rounded-lg object-cover border border-indigo-200 dark:border-slate-700"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Dr. S. K. Rajan</span>
              <span className="text-[10px] text-slate-400 font-medium">Principal & Super Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 text-xs z-50 animate-scale-up">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl mb-2">
                <p className="font-bold text-indigo-950 dark:text-indigo-200">Dr. S. K. Rajan</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400">admin.principal@srcet.edu.in</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    notifyInfo("Profile Settings Opened", "System Settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Admin Profile</span>
                </button>
                <button
                  onClick={() => {
                    notifyInfo("Security & Roles Opened", "Admin");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Security & Permissions</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={() => {
                    notifyInfo("Logged out safely", "Session Ended");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
