import React from 'react';
import DataTable from '../../components/common/DataTable';

export const DayBookPage = () => {
  const dayEntries = [
    { txnId: 'TXN-901', time: '09:15 AM', mode: 'UPI', student: 'Kavitha R. Sharma', feeHead: 'Tuition Fee (Sem 6)', amount: 42500 },
    { txnId: 'TXN-902', time: '11:30 AM', mode: 'Bank Challan', student: 'Aditya V. Karthik', feeHead: 'Hostel Boarding', amount: 25000 },
    { txnId: 'TXN-903', time: '02:45 PM', mode: 'Cash', student: 'Siddharth N. Nair', feeHead: 'Exam Fee', amount: 3500 }
  ];

  const columns = [
    { header: 'Txn Ref ID', key: 'txnId', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Time', key: 'time', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Payment Mode', key: 'mode', render: (val) => <span className="font-semibold text-purple-600">{val}</span> },
    { header: 'Student Name', key: 'student', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Fee Particulars', key: 'feeHead' },
    { header: 'Collected Amount (₹)', key: 'amount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Day Book Transaction Audit</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Chronological audit log of all fee transactions recorded today across all payment modes</p>
      </div>

      <DataTable columns={columns} data={dayEntries} />
    </div>
  );
};

export default DayBookPage;
