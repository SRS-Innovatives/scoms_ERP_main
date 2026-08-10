import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import { PhoneCall, ShieldAlert } from 'lucide-react';

export const EmergencyContactPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-rose-500" /> Emergency Contact Details
      </h3>

      <div className="p-4 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Contact Name</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.emergencyContact.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Relationship</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.emergencyContact.relation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Phone Number</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5" /> {mockStaffProfile.emergencyContact.phone}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-rose-200 dark:border-rose-800">
          <span className="text-slate-600 dark:text-slate-400">Address</span>
          <span className="font-medium text-right max-w-xs text-slate-800 dark:text-slate-200">
            {mockStaffProfile.emergencyContact.address}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactPage;
