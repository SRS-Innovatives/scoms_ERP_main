import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import authService from '../../services/authService';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
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
      navigate('/student/settings');
    } catch (err) {
      showError(err.message || 'Failed to change password', 'Change Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/90 text-white space-y-5">
        <h2 className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-400" /> Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <input
            type="password"
            required
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
          />
          <input
            type="password"
            required
            placeholder="New Password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
          />
          <input
            type="password"
            required
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
          />
          <button type="submit" disabled={saving} className="w-full py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50">
            {saving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
