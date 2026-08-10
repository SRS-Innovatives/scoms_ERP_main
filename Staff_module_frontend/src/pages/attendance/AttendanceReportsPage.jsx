import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Download } from 'lucide-react';

export const AttendanceReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Analytics & Custom Reports</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl">
          <Download className="w-4 h-4" /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Monthly Class Attendance Trend (%)" height={220} />
        <PerformanceChart title="Defaulters & Low Attendance Students (<75%)" height={220} />
      </div>
    </div>
  );
};

export default AttendanceReportsPage;
