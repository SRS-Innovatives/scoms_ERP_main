import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Moon, Sun, Bell, Shield, Lock } from 'lucide-react';

export const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const { success } = useNotification();

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <PageHeader title="Portal Settings & Preferences" subtitle="Theme modes, notifications, and security." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between py-2 border-b">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Dark Theme Mode</h4>
            <p className="text-[11px] text-slate-400">Toggle dark / light glassmorphism interface</p>
          </div>
          <button onClick={toggleTheme} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold">
            {isDark ? 'Dark Mode On' : 'Light Mode On'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">WhatsApp & SMS Notifications</h4>
            <p className="text-[11px] text-slate-400">Receive exam schedules & fee reminders</p>
          </div>
          <input type="checkbox" defaultChecked className="rounded bg-slate-800 text-indigo-600" />
        </div>

        <button
          onClick={() => success('Password change link sent to registered email.', 'Security Reset Link')}
          className="w-full py-2.5 font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
        >
          Change Portal Password
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
