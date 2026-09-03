import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import { apiCall } from '../../services/api';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

export const SuperAdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useNotification();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
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
        const res = await apiCall('/api/v1/super-admin/auth/profile', { method: 'PATCH', body: { avatar: reader.result } });
        updateUser({ avatar: res.data.avatar });
        success('Profile photo updated.');
      } catch (err) {
        showError(err.message || 'Failed to upload photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => showError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    success('Super Admin profile updated.', 'Profile Saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div className="relative shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500" />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-indigo-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Change photo"
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoSelect} className="hidden" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
          <p className="text-xs text-indigo-600 font-semibold">{user?.role} • SCOMS Platform Master</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Account Profile & Security</h3>
        <FormInput label="Full Name" value={user?.name || ''} />
        <FormInput label="Official Super Admin Email" value={user?.email || ''} />
        <FormInput label="Change Password" type="password" placeholder="Enter new password" />

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminProfilePage;
