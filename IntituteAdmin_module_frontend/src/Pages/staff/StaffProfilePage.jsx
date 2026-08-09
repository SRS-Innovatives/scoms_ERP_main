import React from 'react';
import { staffList } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import { Mail, Phone, Award, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

export const StaffProfilePage = () => {
  const staff = staffList[0]; // Dr. R. Ramanathan

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs glass-card">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img src={staff.photo} alt={staff.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-indigo-100 dark:border-slate-800 shadow-md shrink-0" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{staff.name}</h1>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">Emp ID: {staff.empId}</p>
              </div>
              <StatusBadge status={staff.status} />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{staff.role} - {staff.dept}</p>
            <p className="text-xs text-slate-500">{staff.qualification}</p>
            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {staff.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {staff.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
