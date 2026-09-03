import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import {
  Menu,
  Sun,
  Moon,
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
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export const Navbar = ({ onToggleSidebar, onToggleMobile }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { notifyInfo } = useNotification();
  const { institution } = useInstitution();
  const { profile, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const selectedInstitute = institution?.code || institution?.name || 'SCOMS';
  const adminName = profile?.institution?.principalName || profile?.staff?.designation || 'Institute Admin';
  const adminEmail = profile?.email || '';

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
        {/* Institution Badge — an Institute Admin account belongs to exactly one tenant institution, so this is informational, not a switcher */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{selectedInstitute}</span>
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
        <NotificationBell />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={adminName}
                className="w-8 h-8 rounded-lg object-cover border border-indigo-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg border border-indigo-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{adminName}</span>
              <span className="text-[10px] text-slate-400 font-medium">Institute Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 text-xs z-50 animate-scale-up">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl mb-2">
                <p className="font-bold text-indigo-950 dark:text-indigo-200">{adminName}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400">{adminEmail}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Admin Profile</span>
                </button>
                <button
                  onClick={() => {
                    notifyInfo("Security & Permissions is on the roadmap", "Coming Soon");
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
                    setShowProfileMenu(false);
                    logout();
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
