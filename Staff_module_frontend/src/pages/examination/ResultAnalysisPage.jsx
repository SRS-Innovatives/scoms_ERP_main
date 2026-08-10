import React from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';

export const ResultAnalysisPage = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Result Analysis & Grade Distribution</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart title="Physics Grade Distribution (A+, A, B, C, F)" height={220} />
        <PerformanceChart title="Class Average vs School Target Score" height={220} />
      </div>
    </div>
  );
};

export default ResultAnalysisPage;
