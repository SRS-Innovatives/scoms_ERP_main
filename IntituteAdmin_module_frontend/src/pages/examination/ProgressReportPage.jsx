import React from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import { Printer } from 'lucide-react';

export const ProgressReportPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Progress Report Card</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable monthly progress report sent to parents (Attendance + Test Marks)</p>
      </div>

      <div className="bg-white text-slate-900 p-8 rounded-2xl border shadow-xl max-w-3xl mx-auto print-container my-6">
        <PrintHeader title="STUDENT PROGRESS REPORT" subtitle="Continuous Assessment & Attendance Feedback" documentNo="PR/2025/CS101" />
        <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
          <p><span className="font-semibold text-slate-600">Student:</span> <span className="font-bold text-slate-900">Kavitha R. Sharma (Roll: 21CS101)</span></p>
          <p><span className="font-semibold text-slate-600">Overall Attendance:</span> <span className="font-mono font-bold text-emerald-700">94.8% (Satisfactory)</span></p>
          <p><span className="font-semibold text-slate-600">CAT-1 Performance:</span> <span className="font-bold text-indigo-900">88.5% (Class Rank #1)</span></p>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
          <Printer className="w-4 h-4" />
          <span>Print Progress Report</span>
        </button>
      </div>
    </div>
  );
};

export default ProgressReportPage;
