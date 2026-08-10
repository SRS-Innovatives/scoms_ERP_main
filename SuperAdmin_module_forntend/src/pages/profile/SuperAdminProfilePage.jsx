import React from 'react';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/common/FormInput';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck, Lock, User } from 'lucide-react';

export const SuperAdminProfilePage = () => {
  const { user } = useAuth();
  const { success } = useNotification();

  const handleUpdate = (e) => {
    e.preventDefault();
    success('Super Admin profile updated.', 'Profile Saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <img src={user?.avatar} alt={user?.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500" />
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
