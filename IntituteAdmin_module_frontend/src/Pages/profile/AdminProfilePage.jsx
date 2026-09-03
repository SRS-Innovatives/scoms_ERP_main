import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import authService from '../../services/authService';
import { Camera, Loader2, ShieldCheck, Save, User as UserIcon, KeyRound } from 'lucide-react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

/** The Institute Admin's own account — their photo, contact details, and password.
 * Distinct from Institution Setup → Institute Profile, which is the school/college's own
 * organisation details, not this person's personal account. */
export const AdminProfilePage = () => {
  const { profile, loading, refetchProfile } = useAuth();
  const { notifySuccess: success, notifyError: showError } = useNotification();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      showError('Profile photo must be a PNG or JPEG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      showError('Photo must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        await authService.updateProfile({ avatar: reader.result });
        success('Profile photo updated.');
        refetchProfile();
      } catch (err) {
        showError(err.message || 'Failed to upload photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => showError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.oldPassword || !passwords.newPassword) {
      showError('Enter your current password and a new password.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showError('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword });
      success('Password changed successfully.');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !profile) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const displayName = profile.institution?.principalName || profile.staff?.designation || 'Institute Admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Admin Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your own account — photo, contact details, and password.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <UserIcon className="w-9 h-9 text-indigo-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Change photo"
            className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoSelect} className="hidden" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{displayName}</h2>
          <p className="text-xs font-semibold text-indigo-600">{profile.role?.replace(/_/g, ' ')} • {profile.institution?.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
          {profile.userCode && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{profile.userCode}</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div><span className="text-slate-500 block mb-0.5">Email Address</span><span className="font-semibold text-slate-800 dark:text-slate-200">{profile.email || '—'}</span></div>
          <div><span className="text-slate-500 block mb-0.5">Mobile Number</span><span className="font-semibold text-slate-800 dark:text-slate-200">{profile.mobile || '—'}</span></div>
          <div><span className="text-slate-500 block mb-0.5">Role</span><span className="font-semibold text-slate-800 dark:text-slate-200">{profile.role?.replace(/_/g, ' ')}</span></div>
          <div><span className="text-slate-500 block mb-0.5">Institution</span><span className="font-semibold text-slate-800 dark:text-slate-200">{profile.institution?.name || '—'}</span></div>
        </div>
        <p className="text-[11px] text-slate-400 pt-1">Contact your Super Admin to change your registered email or institution assignment.</p>
      </div>

      <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <KeyRound className="w-4 h-4 text-indigo-500" /> Change Password
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
            <input type="password" value={passwords.oldPassword} onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirm New Password</label>
            <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={changingPassword} className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfilePage;
