import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Lock } from 'lucide-react';
import authService from '../../services/authService';

export const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const { success, error: showError } = useNotification();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('New password and confirmation do not match.', 'Password Mismatch');
      return;
    }
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters.', 'Password Too Short');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      success('Password changed successfully.', 'Security Updated');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showError(err.message || 'Failed to change password', 'Change Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <PageHeader title="Portal Settings & Preferences" subtitle="Theme mode and account security." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Dark Theme Mode</h4>
            <p className="text-[11px] text-slate-400">Toggle dark / light glassmorphism interface</p>
          </div>
          <button onClick={toggleTheme} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold">
            {isDark ? 'Dark Mode On' : 'Light Mode On'}
          </button>
        </div>

        <div className="py-2 text-[11px] text-slate-400">
          WhatsApp & SMS notification preferences — coming soon.
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500" /> Change Portal Password
        </h4>
        <input
          type="password"
          required
          placeholder="Current Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        />
        <input
          type="password"
          required
          placeholder="New Password (min. 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        />
        <input
          type="password"
          required
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Updating...' : 'Change Portal Password'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
