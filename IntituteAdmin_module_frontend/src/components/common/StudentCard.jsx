import React from 'react';
import StatusBadge from './StatusBadge';
import { Phone, Mail, MapPin, Award, CreditCard, ShieldCheck } from 'lucide-react';

export const StudentCard = ({ student, onViewDetails, onPrintCard }) => {
  if (!student) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md glass-card">
      <div className="flex items-start gap-4">
        <img
          src={student.photo}
          alt={student.name}
          className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100 dark:border-slate-700 shadow-xs shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{student.name}</h4>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
            Roll: {student.rollNo} | Reg: {student.regNo}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{student.course}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Semester</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{student.yearSem}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Fee Status</span>
          <div>
            <StatusBadge status={student.feeStatus} />
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{student.phone}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Hostel / Bus</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{student.hostel}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
        {onPrintCard && (
          <button
            onClick={() => onPrintCard(student)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ID Card</span>
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(student)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;
