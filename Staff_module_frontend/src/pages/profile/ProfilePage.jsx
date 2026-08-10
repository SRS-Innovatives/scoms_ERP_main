import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import { User, Mail, Phone, Calendar, Building, Award, Briefcase, CreditCard, ShieldAlert, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={mockStaffProfile.avatar}
            alt={mockStaffProfile.name}
            className="w-24 h-24 rounded-3xl object-cover border-4 border-sky-500/30 shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.name}</h2>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">{mockStaffProfile.designation}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dept: {mockStaffProfile.department} • Employee ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{mockStaffProfile.id}</span>
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

      {/* Grid info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal & Contact Info */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-500" /> Personal & Contact Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Email Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.email}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Phone Number</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.phone}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Date of Birth</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.dob}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Blood Group</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.bloodGroup}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Date of Joining</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.joiningDate}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Experience</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.experienceYears} Years</span>
            </div>
          </div>
        </div>

        {/* Bank & Emergency Details */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Bank & Financial Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Bank Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.bankDetails.bankName}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Account Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.bankDetails.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">IFSC Code</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.bankDetails.ifscCode}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">PAN Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{mockStaffProfile.bankDetails.panNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
