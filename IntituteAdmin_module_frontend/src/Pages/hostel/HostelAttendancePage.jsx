import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { studentsList } from '../../data/mockData';

export const HostelAttendancePage = () => {
  const hostelers = studentsList.filter((s) => s.hostel !== 'Day Scholar');

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Hostel Block & Room', key: 'hostel' },
    { header: 'Night Curfew Roll Call (09:00 PM)', key: 'id', render: () => <StatusBadge status="Present" text="IN ROOM" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Night Curfew Roll Call</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Night attendance roll call register verified by resident warden</p>
      </div>

      <DataTable columns={columns} data={hostelers} />
    </div>
  );
};

export default HostelAttendancePage;
