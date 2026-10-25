import React from 'react';
import ChartCard from '../../components/common/ChartCard';
import DataTable from '../../components/common/DataTable';

export const SubjectAnalysisPage = () => {
  const analysis = [
    { code: 'CS8601', subject: 'Mobile Computing', faculty: 'Prof. S. Malathi', total: 60, pass: 58, fail: 2, passPct: 96.6 },
    { code: 'CS8602', subject: 'Compiler Design', faculty: 'Dr. R. Ramanathan', total: 60, pass: 54, fail: 6, passPct: 90.0 }
  ];

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Subject Title', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Faculty Incharge', key: 'faculty' },
    { header: 'Appeared', key: 'total' },
    { header: 'Passed', key: 'pass', render: (val) => <span className="font-bold text-emerald-600">{val}</span> },
    { header: 'Failed', key: 'fail', render: (val) => <span className="font-bold text-rose-600">{val}</span> },
    { header: 'Pass Percentage', key: 'passPct', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}%</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject-wise Result Analysis</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Faculty-wise pass percentage performance metric</p>
      </div>

      <DataTable columns={columns} data={analysis} />
    </div>
  );
};

export default SubjectAnalysisPage;
