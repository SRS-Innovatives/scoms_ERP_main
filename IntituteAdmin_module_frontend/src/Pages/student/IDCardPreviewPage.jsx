import React from 'react';
import { Printer } from 'lucide-react';
import { instituteInfo, studentsList } from '../../data/mockData';

export const IDCardPreviewPage = () => {
  const student = studentsList[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Smart ID Card Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable RFID/Barcode identity card format for library, attendance & campus gates</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-8 no-print">
        {/* ID Card Front */}
        <div className="w-72 h-[440px] bg-linear-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-2xl p-5 border-2 border-indigo-500/30 flex flex-col justify-between relative overflow-hidden text-center">
          {/* Header */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">{instituteInfo.shortName}</h3>
            <p className="text-[9px] text-indigo-200 font-semibold">{instituteInfo.name}</p>
            <p className="text-[8px] text-indigo-300/80">STUDENT IDENTITY CARD</p>
          </div>

          {/* Photo */}
          <div className="my-2">
            <div className="w-24 h-28 mx-auto rounded-xl border-2 border-white/80 overflow-hidden shadow-lg bg-white p-0.5">
              <img src={student.photo} alt={student.name} className="w-full h-full object-cover rounded-lg" />
            </div>
            <h4 className="text-sm font-bold text-white mt-2 leading-tight">{student.name}</h4>
            <p className="text-[10px] font-semibold text-amber-300 uppercase">{student.course}</p>
          </div>

          {/* Details */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-[10px] space-y-1 text-left border border-white/10">
            <p><span className="text-indigo-200">Roll No:</span> <span className="font-mono font-bold text-white">{student.rollNo}</span></p>
            <p><span className="text-indigo-200">Reg No:</span> <span className="font-mono font-bold text-white">{student.regNo}</span></p>
            <p><span className="text-indigo-200">Blood Group:</span> <span className="font-bold text-rose-300">{student.bloodGroup}</span></p>
            <p><span className="text-indigo-200">Validity:</span> <span className="font-bold text-white">2021 - 2025</span></p>
          </div>

          {/* Footer Barcode */}
          <div className="pt-1 border-t border-white/20">
            <div className="h-6 bg-white rounded flex items-center justify-center font-mono text-[9px] text-slate-900 font-bold tracking-widest">
              ||| |||| || | ||||| |||
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print ID Card</span>
        </button>
      </div>
    </div>
  );
};

export default IDCardPreviewPage;
