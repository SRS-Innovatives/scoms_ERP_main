import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';

export const AttendanceVsMarksPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Correlation: Attendance Rate vs Assessment Marks</h2>
      <PerformanceChart title="Impact of Regular Attendance on Final Exam Scores" height={240} />
    </div>
  );
};

export default AttendanceVsMarksPage;
