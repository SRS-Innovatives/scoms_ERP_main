import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { staffList } from '../../data/mockData';

export const StaffAttendancePage = () => {
  const columns = [
    { header: 'Emp ID', key: 'empId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Faculty Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Role & Dept', key: 'role' },
    { header: 'In Time (Biometric)', key: 'id', render: () => <span className="font-mono font-semibold">08:42 AM</span> },
    { header: 'Out Time (Biometric)', key: 'id', render: () => <span className="font-mono font-semibold">04:35 PM</span> },
    { header: 'Today Status', key: 'id', render: () => <StatusBadge status="Present" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Faculty Attendance Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Biometric punch in/out timestamps for teaching & admin staff</p>
      </div>

      <DataTable columns={columns} data={staffList} />
    </div>
  );
};

export default StaffAttendancePage;
