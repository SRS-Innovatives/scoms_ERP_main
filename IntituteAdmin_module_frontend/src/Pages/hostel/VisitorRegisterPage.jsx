import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const VisitorRegisterPage = () => {
  const visitors = [
    { visitorName: 'Muthusamy Sundaram', relationship: 'Father', student: 'Priyanka M. Sundaram (21AD015)', checkIn: '09-Aug 04:15 PM', checkOut: '09-Aug 05:30 PM', gatePass: 'GP-84920' }
  ];

  const columns = [
    { header: 'Gate Pass No', key: 'gatePass', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Visitor Name', key: 'visitorName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Relationship', key: 'relationship' },
    { header: 'Visiting Student', key: 'student', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'In Time', key: 'checkIn', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Out Time', key: 'checkOut', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Gate Status', key: 'id', render: () => <StatusBadge status="Completed" text="CHECKED OUT" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Visitor & Parent Gate Pass Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Security gate entry log for visiting parents & local guardians</p>
      </div>

      <DataTable columns={columns} data={visitors} />
    </div>
  );
};

export default VisitorRegisterPage;
