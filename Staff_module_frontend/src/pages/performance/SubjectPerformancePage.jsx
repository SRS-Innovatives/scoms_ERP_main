import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';

export const SubjectPerformancePage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Subject-wise Class Performance Comparison</h2>
      <PerformanceChart title="Physics Marks Distribution Across Classes (10-A vs 11-B vs 12-A)" height={240} />
    </div>
  );
};

export default SubjectPerformancePage;
