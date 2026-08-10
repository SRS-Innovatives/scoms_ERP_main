import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';

export const AssignmentAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assignment Submission & Grading Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Submission Rate per Assignment (%)" height={220} />
        <PerformanceChart title="Average Homework Score Distribution" height={220} />
      </div>
    </div>
  );
};

export default AssignmentAnalyticsPage;
