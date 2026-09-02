import React, { useState, useEffect, useCallback, useRef } from 'react';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { User, Save, Loader2, Camera } from 'lucide-react';
import studentService from '../../services/studentService';

const EMPTY_FORM = { email: '', phone: '', address: '', city: '', state: '', pincode: '' };
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

export const MyProfilePage = () => {
  const { success, error: showError } = useNotification();
  const [activeTab, setActiveTab] = useState('Personal');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    studentService.getProfile()
      .then((res) => {
        const p = res.data;
        setProfile(p);
        setFormData({
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
        });
      })
      .catch((err) => showError(err.message || 'Failed to load profile', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await studentService.updateProfile(formData);
      setProfile(res.data);
      success('Contact details updated successfully.', 'Profile Saved');
    } catch (err) {
      showError(err.message || 'Failed to update profile', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

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
        const res = await studentService.updateProfile({ avatar: reader.result });
        setProfile(res.data);
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

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!profile) return null;

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const parentLink = profile.parents?.[0]?.parent;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Summary */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0">
          {profile.user?.avatar ? (
            <img src={profile.user.avatar} alt={fullName} className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-500 shadow-md" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-indigo-100 dark:bg-indigo-950 border-4 border-indigo-500 shadow-md flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              <User className="w-10 h-10" />
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
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{fullName}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {profile.admissionNumber}
            </span>
          </div>
          <p className="text-xs text-slate-500">{profile.course?.name} • {profile.department?.name}</p>
          <p className="text-xs text-slate-500">{profile.institution?.name}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {['Personal', 'Contact', 'Academic', 'Parent/Guardian'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab} Information
          </button>
        ))}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        {activeTab === 'Personal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Student Full Name (Contact admin to change)" value={fullName} disabled />
            <FormInput label="Admission Number (Read-Only)" value={profile.admissionNumber} disabled />
            <FormInput label="Register Number (Read-Only)" value={profile.registerNumber || '—'} disabled />
            <FormInput label="Date of Birth" type="date" value={profile.dob ? profile.dob.slice(0, 10) : ''} disabled />
            <FormInput label="Gender" value={profile.gender} disabled />
            <FormInput label="Blood Group" value={profile.bloodGroup || '—'} disabled />
          </div>
        )}

        {activeTab === 'Contact' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Email Address" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
            <FormInput label="Mobile Number" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            <FormInput label="City" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} />
            <FormInput label="State" value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} />
            <FormInput label="Pincode" value={formData.pincode} onChange={(v) => setFormData({ ...formData, pincode: v })} />
            <div className="sm:col-span-2">
              <FormInput label="Full Residence Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} />
            </div>
          </div>
        )}

        {activeTab === 'Academic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Institution" value={profile.institution?.name || '—'} disabled />
            <FormInput label="Department" value={profile.department?.name || '—'} disabled />
            <FormInput label="Course" value={profile.course?.name || '—'} disabled />
            <FormInput label="Section" value={profile.section?.name || '—'} disabled />
            <FormInput label="Roll Number" value={profile.rollNumber || '—'} disabled />
            <FormInput label="Admission Date" value={profile.admissionDate ? profile.admissionDate.slice(0, 10) : '—'} disabled />
          </div>
        )}

        {activeTab === 'Parent/Guardian' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Father's Name" value={parentLink?.fatherName || '—'} disabled />
            <FormInput label="Mother's Name" value={parentLink?.motherName || '—'} disabled />
            <FormInput label="Father's Phone" value={parentLink?.fatherPhone || '—'} disabled />
            <FormInput label="Mother's Phone" value={parentLink?.motherPhone || '—'} disabled />
            {!parentLink && <p className="sm:col-span-2 text-slate-500">No parent/guardian record linked yet.</p>}
          </div>
        )}

        {activeTab === 'Contact' && (
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Contact Details'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MyProfilePage;
