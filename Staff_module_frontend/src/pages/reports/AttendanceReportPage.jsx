import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Download } from 'lucide-react';

export const AttendanceReportPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Taken Master Report</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl">
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      <PerformanceChart title="Monthly Class Attendance Taken %" height={220} />
    </div>
  );
};

export default AttendanceReportPage;
