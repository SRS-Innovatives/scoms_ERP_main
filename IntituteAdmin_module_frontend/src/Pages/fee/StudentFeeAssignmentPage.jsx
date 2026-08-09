import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { studentsList } from '../../data/mockData';

export const StudentFeeAssignmentPage = () => {
  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course' },
    { header: 'Assigned Fee Structure', key: 'id', render: () => <span className="font-semibold">Tuition (₹42,500) + Exam (₹3,500)</span> },
    { header: 'Concession / Scholarship', key: 'scholarship', render: (val) => <span className="font-semibold text-emerald-700">{val}</span> },
    { header: 'Net Payable Amount', key: 'pendingFeeAmount', render: (val, row) => <span className="font-mono font-bold text-slate-900">₹{(46000 - val).toLocaleString()}</span> },
    { header: 'Status', key: 'feeStatus', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Individual Student Fee Assignment</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Custom fee assignment, scholarship concession waivers per student</p>
      </div>

      <DataTable columns={columns} data={studentsList} />
    </div>
  );
};

export default StudentFeeAssignmentPage;
