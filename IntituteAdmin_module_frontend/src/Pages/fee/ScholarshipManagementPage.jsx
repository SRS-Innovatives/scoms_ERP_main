import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const ScholarshipManagementPage = () => {
  const scholarships = [
    { student: 'Kavitha R. Sharma', scheme: 'First Generation Graduate (FGG)', govtSanctionNo: 'TN/FGG/2025/492', waiverAmount: 20000, status: 'Approved' },
    { student: 'Priyanka M. Sundaram', scheme: '7.5% Govt School Quota', govtSanctionNo: 'TN/7.5/2025/104', waiverAmount: 85000, status: 'Approved' },
    { student: 'Vigneshwaran K. Pandian', scheme: 'Post Matric Scholarship (PMS)', govtSanctionNo: 'PMS/2025/3820', waiverAmount: 42500, status: 'Approved' }
  ];

  const columns = [
    { header: 'Student Name', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Scholarship Scheme', key: 'scheme', render: (val) => <span className="font-semibold text-indigo-600">{val}</span> },
    { header: 'Govt Sanction Ref No', key: 'govtSanctionNo', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Fee Concession Amount (₹)', key: 'waiverAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Sanction Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Scholarship & Govt Concession Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">First Gen Graduate, 7.5% Govt School Quota, PMS & Merit Scholarship Waivers</p>
      </div>

      <DataTable columns={columns} data={scholarships} />
    </div>
  );
};

export default ScholarshipManagementPage;
