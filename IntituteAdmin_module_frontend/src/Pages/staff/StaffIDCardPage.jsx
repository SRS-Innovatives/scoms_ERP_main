import React from 'react';
import { Printer } from 'lucide-react';
import { instituteInfo, staffList } from '../../data/mockData';

export const StaffIDCardPage = () => {
  const staff = staffList[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff ID Card Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Faculty RFID & Barcode photo identity card preview</p>
      </div>

      <div className="flex justify-center py-6 no-print">
        <div className="w-72 h-[440px] bg-linear-to-b from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-2xl shadow-2xl p-5 border-2 border-indigo-400/30 flex flex-col justify-between text-center">
          <div>
            <h3 className="text-xs font-black uppercase text-amber-300">{instituteInfo.shortName} FACULTY</h3>
            <p className="text-[9px] text-indigo-200">{instituteInfo.name}</p>
          </div>
          <div>
            <img src={staff.photo} alt={staff.name} className="w-24 h-28 mx-auto rounded-xl object-cover border-2 border-white" />
            <h4 className="text-sm font-bold text-white mt-2">{staff.name}</h4>
            <p className="text-[10px] text-amber-300 font-semibold uppercase">{staff.role}</p>
            <p className="text-[9px] text-slate-300">{staff.dept}</p>
          </div>
          <div className="bg-white/10 p-2 rounded-xl text-[10px] text-left space-y-0.5">
            <p><span className="text-indigo-200">Emp ID:</span> <span className="font-mono font-bold text-white">{staff.empId}</span></p>
            <p><span className="text-indigo-200">DOJ:</span> <span className="font-mono text-white">{staff.doj}</span></p>
          </div>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
          <Printer className="w-4 h-4" />
          <span>Print Staff ID Card</span>
        </button>
      </div>
    </div>
  );
};

export default StaffIDCardPage;
