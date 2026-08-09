import React from 'react';
import StatusBadge from './StatusBadge';
import { Mail, Phone, Briefcase, Award } from 'lucide-react';

export const StaffCard = ({ staff, onViewDetails }) => {
  if (!staff) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md glass-card">
      <div className="flex items-start gap-4">
        <img
          src={staff.photo}
          alt={staff.name}
          className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100 dark:border-slate-700 shadow-xs shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{staff.name}</h4>
            <StatusBadge status={staff.status} />
          </div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{staff.role}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{staff.dept}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Emp ID</span>
          <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{staff.empId}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{staff.experience}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{staff.phone}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Qualification</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{staff.qualification}</p>
        </div>
      </div>

      {onViewDetails && (
        <div className="mt-4 pt-3 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onViewDetails(staff)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            View Staff Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffCard;
