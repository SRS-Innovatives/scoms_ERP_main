import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const FineCollectionPage = () => {
  const fines = [
    { student: 'Aditya V. Karthik', rollNo: '21CS102', book: 'Digital Signal Processing', daysOverdue: 4, fineAmount: 20, status: 'Pending' }
  ];

  const columns = [
    { header: 'Student Name', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Book Title', key: 'book' },
    { header: 'Overdue Days', key: 'daysOverdue', render: (val) => <span className="font-mono text-rose-600 font-bold">{val} Days</span> },
    { header: 'Fine Dues (₹)', key: 'fineAmount', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Overdue Fine Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Collect overdue book fines (₹5/day) & issue library fine receipt</p>
      </div>

      <DataTable columns={columns} data={fines} />
    </div>
  );
};

export default FineCollectionPage;
