import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { studentsList } from '../../data/mockData';

export const SubjectAttendancePage = () => {
  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Subject Code', key: 'id', render: () => <span className="font-mono font-semibold text-purple-600">CS8601</span> },
    { header: 'Subject Title', key: 'id', render: () => <span className="font-semibold">Mobile Computing</span> },
    { header: 'Period / Hour', key: 'id', render: () => <span className="font-mono">Hour 2 (10:30 AM - 11:30 AM)</span> },
    { header: 'Status', key: 'id', render: () => <StatusBadge status="Present" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject-wise Period Attendance</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Hour-by-hour lecture session roll call by course faculty</p>
      </div>

      <DataTable columns={columns} data={studentsList} />
    </div>
  );
};

export default SubjectAttendancePage;
