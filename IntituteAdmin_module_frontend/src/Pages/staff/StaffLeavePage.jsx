import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { useNotification } from '../../context/NotificationContext';

export const StaffLeavePage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const leaves = [
    { empId: 'T-CSE-028', name: 'Prof. S. Malathi', leaveType: 'Casual Leave (CL)', dates: '12-Aug-2026 (1 Day)', reason: 'Personal work', status: 'Pending' },
    { empId: 'T-CSE-012', name: 'Dr. R. Ramanathan', leaveType: 'On Duty (OD)', dates: '05-Aug-2026 (2 Days)', reason: 'Anna University Valuation Duty', status: 'Approved' }
  ];

  const columns = [
    { header: 'Emp ID', key: 'empId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Staff Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Leave Category', key: 'leaveType' },
    { header: 'Dates / Duration', key: 'dates', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Reason', key: 'reason' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Action',
      key: 'status',
      render: (val, row) => (
        val === 'Pending' && (
          <button onClick={() => notifySuccess(`Approved leave for ${row.name}`)} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
            Approve
          </button>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Leave Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Casual Leave (CL), Earned Leave (EL), Medical Leave & On Duty (OD) approvals</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search leave application..." />
      <DataTable columns={columns} data={leaves} />
    </div>
  );
};

export default StaffLeavePage;
