import React, { useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { QrCode, Printer, ShieldCheck, RefreshCw } from 'lucide-react';

export const DigitalIdCardPage = () => {
  const { student } = useStudentAuth();
  const [side, setSide] = useState('Front');

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Digital Student ID Card</h1>
        <div className="flex gap-2">
          <button onClick={() => setSide(side === 'Front' ? 'Back' : 'Front')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Flip ({side})
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* ID Card Front Side */}
      {side === 'Front' ? (
        <div className="glass-card p-6 rounded-3xl border-2 border-indigo-500 shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white space-y-4 relative overflow-hidden print-container">
          <div className="flex justify-between items-center border-b border-white/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-xs">S</span>
              <div>
                <h3 className="font-extrabold text-xs tracking-tight">{student?.institution}</h3>
                <p className="text-[9px] text-indigo-300">CAMPUS STUDENT IDENTITY CARD</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex gap-4 items-center">
            <span className="w-20 h-24 rounded-2xl bg-indigo-800 flex items-center justify-center text-2xl font-black border-2 border-indigo-400 shadow-lg shrink-0">
              {student?.name ? `${student.name[0]}${student.name.split(' ')[1]?.[0] || ''}` : '..'}
            </span>
            <div className="space-y-1 text-xs">
              <h2 className="text-base font-black text-white">{student?.name}</h2>
              <p className="text-indigo-300 font-mono font-bold text-[11px]">{student?.admissionNo}</p>
              <p className="text-[11px] text-slate-300">{student?.course}</p>
              <p className="text-[10px] text-slate-400">{student?.department} • Sem {student?.semester}</p>
              <p className="text-[10px] text-slate-400">Valid: {student?.batch}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 flex justify-between items-center text-[10px] text-indigo-200">
            <span>Reg: {student?.regNo}</span>
            <span className="font-bold text-emerald-400">STATUS: ACTIVE</span>
          </div>
        </div>
      ) : (
        /* ID Card Back Side */
        <div className="glass-card p-6 rounded-3xl border-2 border-indigo-500 shadow-2xl bg-slate-900 text-white space-y-4 text-xs print-container">
          <div className="text-center space-y-1 border-b border-slate-800 pb-2">
            <h4 className="font-bold uppercase text-[10px] text-indigo-400">Permanent Address & Contact</h4>
            <p className="text-slate-300 text-[11px]">{student?.address}, {student?.city}, {student?.state} - {student?.pincode}</p>
            <p className="text-slate-400 text-[10px]">Emergency Contact: {student?.parentPhone} ({student?.fatherName})</p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl">
            <QrCode className="w-28 h-28 text-slate-900" />
            <span className="text-[9px] font-mono text-slate-600 font-bold mt-1">SCAN FOR CAMPUS VERIFICATION</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalIdCardPage;
