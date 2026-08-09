import React from 'react';
import DataTable from '../../components/common/DataTable';
import { studentsList } from '../../data/mockData';

export const StudentRouteMappingPage = () => {
  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course' },
    { header: 'Assigned Bus Route', key: 'transport', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Pickup Stop Point', key: 'id', render: () => 'Velachery Vijaya Nagar Bus Stop' },
    { header: 'Bus Pass Status', key: 'id', render: () => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">PASS ISSUED</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Bus Route Mapping</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Map students to specific bus pickup stops & route passes</p>
      </div>

      <DataTable columns={columns} data={studentsList} />
    </div>
  );
};

export default StudentRouteMappingPage;
