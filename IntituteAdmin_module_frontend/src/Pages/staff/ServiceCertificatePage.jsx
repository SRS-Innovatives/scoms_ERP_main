import React from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import { Printer } from 'lucide-react';
import { instituteInfo, staffList } from '../../data/mockData';

export const ServiceCertificatePage = () => {
  const staff = staffList[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Service & Experience Certificate</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Official certificate of service for faculty employment verification</p>
      </div>

      <div className="bg-white text-slate-900 p-10 rounded-2xl border-4 border-double border-slate-900 shadow-2xl max-w-4xl mx-auto print-container my-6">
        <PrintHeader title="SERVICE & EXPERIENCE CERTIFICATE" subtitle="Issued by Office of Human Resources" documentNo="EXP/2025/1042" />

        <div className="my-10 text-sm leading-relaxed text-slate-900 font-serif px-6 space-y-6">
          <p className="text-justify text-base">
            This is to certify that <span className="font-bold underline uppercase">{staff.name}</span> (Emp ID: <span className="font-mono font-bold">{staff.empId}</span>) has been working in this institution as <span className="font-bold">{staff.role}</span> in the Department of <span className="font-bold">{staff.dept}</span> since <span className="font-bold">{staff.doj}</span>.
          </p>
          <p className="text-justify text-base">
            During his / her tenure of <span className="font-bold">{staff.experience}</span>, his / her performance in teaching, academic research, laboratory supervision and institutional administration has been <span className="font-bold text-emerald-800 uppercase">HIGHLY SATISFACTORY</span>.
          </p>
          <p className="text-xs font-sans text-slate-600 pt-4">We wish him / her all success in future endeavors.</p>
        </div>

        <div className="pt-16 flex items-end justify-between text-xs font-sans">
          <div>
            <p className="text-slate-600">Date: <span className="font-bold text-slate-900">09-Aug-2026</span></p>
          </div>
          <div className="text-center">
            <p className="border-t border-slate-900 w-44 pt-1 font-bold text-slate-900">PRINCIPAL & DIRECTOR</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
          <Printer className="w-4 h-4" />
          <span>Print Service Certificate</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceCertificatePage;
