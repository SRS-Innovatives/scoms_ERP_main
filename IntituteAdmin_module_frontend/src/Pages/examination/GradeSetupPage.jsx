import React from 'react';
import DataTable from '../../components/common/DataTable';

export const GradeSetupPage = () => {
  const grades = [
    { grade: 'O', point: 10, range: '91 - 100 Marks', desc: 'Outstanding' },
    { grade: 'A+', point: 9, range: '81 - 90 Marks', desc: 'Excellent' },
    { grade: 'A', point: 8, range: '71 - 80 Marks', desc: 'Very Good' },
    { grade: 'B+', point: 7, range: '61 - 70 Marks', desc: 'Good' },
    { grade: 'B', point: 6, range: '50 - 60 Marks', desc: 'Average / Pass' },
    { grade: 'RA / F', point: 0, range: '< 50 Marks', desc: 'Re-appear / Fail' }
  ];

  const columns = [
    { header: 'Letter Grade', key: 'grade', render: (val) => <span className="font-bold text-lg text-indigo-600 font-mono">{val}</span> },
    { header: 'Grade Point (10 Scale)', key: 'point', render: (val) => <span className="font-mono font-bold text-slate-900">{val} Points</span> },
    { header: 'Marks Range', key: 'range', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Qualitative Description', key: 'desc', render: (val) => <span className="font-semibold text-slate-700">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Grading System & CGPA Scale Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Anna University / UGC Choice Based Credit System (CBCS) grade point mapping</p>
      </div>

      <DataTable columns={columns} data={grades} />
    </div>
  );
};

export default GradeSetupPage;
