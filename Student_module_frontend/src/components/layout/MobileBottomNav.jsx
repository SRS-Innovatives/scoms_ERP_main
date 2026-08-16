import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, FileText, Bell, User, Menu } from 'lucide-react';

export const MobileBottomNav = ({ onOpenDrawer }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass-nav border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print bg-white/95 dark:bg-slate-900/95 shadow-lg">
      <NavLink
        to="/student/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      <NavLink
        to="/student/classes"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px]">Classes</span>
      </NavLink>

      <NavLink
        to="/student/assignments"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <FileText className="w-5 h-5" />
        <span className="text-[10px]">Tasks</span>
      </NavLink>

      <NavLink
        to="/student/notifications"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all relative ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        <span className="text-[10px]">Alerts</span>
      </NavLink>

      <NavLink
        to="/student/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </NavLink>

      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-slate-500 dark:text-slate-400"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px]">More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
