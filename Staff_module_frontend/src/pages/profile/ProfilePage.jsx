import React, { useState, useEffect, useRef } from 'react';
import { User, CreditCard, Edit, Loader2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import profileService from '../../services/profileService';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { error: showError, success } = useNotification();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadProfile = () => {
    profileService.getMyProfile()
      .then((res) => setStaff(res.data))
      .catch((err) => showError(err.message || 'Failed to load profile', 'Load Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(loadProfile, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        await profileService.updateMyProfile({ avatar: reader.result });
        success('Profile photo updated.');
        loadProfile();
      } catch (err) {
        showError(err.message || 'Failed to upload photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => showError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  if (loading || !staff) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            {staff.user?.avatar ? (
              <img src={staff.user.avatar} alt={`${staff.firstName} ${staff.lastName}`} className="w-24 h-24 rounded-3xl object-cover border-4 border-sky-500/30 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-sky-600 text-white flex items-center justify-center text-3xl font-black border-4 border-sky-500/30 shadow-lg">
                {staff.firstName?.[0]}{staff.lastName?.[0]}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change photo"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handlePhotoSelect} className="hidden" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{staff.firstName} {staff.lastName}</h2>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">{staff.designation}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dept: {staff.department?.name || '—'} • Employee ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{staff.employeeCode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/staff/profile/edit')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 rounded-xl transition-all shadow-sm"
        >
          <Edit className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-500" /> Personal & Contact Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-500 dark:text-slate-400 block">Email Address</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.user?.email}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Phone Number</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.user?.mobile || '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Date of Birth</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.dob ? new Date(staff.dob).toLocaleDateString('en-IN') : '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Blood Group</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.bloodGroup || '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Date of Joining</span><span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(staff.joiningDate).toLocaleDateString('en-IN')}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Experience</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.experience || '—'}</span></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Bank & Financial Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-500 dark:text-slate-400 block">Bank Name</span><span className="font-semibold text-slate-800 dark:text-slate-200">{staff.bankName || '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">Account Number</span><span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{staff.bankAccountNumber || '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">IFSC Code</span><span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{staff.bankIfscCode || '—'}</span></div>
            <div><span className="text-slate-500 dark:text-slate-400 block">PAN Number</span><span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{staff.panNumber || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
