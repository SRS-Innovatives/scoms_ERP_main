import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import { CreditCard, Lock } from 'lucide-react';

export const BankDetailsPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" /> Salary Account & Bank Info
        </h3>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <Lock className="w-3 h-3" /> Encrypted & Verified
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">Account Holder Name</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.accountName}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">Bank Name</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.bankName}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">Account Number</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.accountNumber}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">IFSC Code</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.ifscCode}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">Branch Name</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.branch}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span className="text-slate-500">PAN Number</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{mockStaffProfile.bankDetails.panNumber}</span>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsPage;
