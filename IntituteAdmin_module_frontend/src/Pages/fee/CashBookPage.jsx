import React from 'react';
import DataTable from '../../components/common/DataTable';

export const CashBookPage = () => {
  const cashEntries = [
    { voucherNo: 'VCH-0912', date: '09-Aug-2026', particulars: 'Tuition Fee Received in Cash (Kavitha R.)', debit: 42500, credit: 0, balance: 142500 },
    { voucherNo: 'VCH-0913', date: '09-Aug-2026', particulars: 'Office Stationery Cash Expense', debit: 0, credit: 1250, balance: 141250 }
  ];

  const columns = [
    { header: 'Voucher No', key: 'voucherNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Date', key: 'date', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Particulars', key: 'particulars', render: (val) => <span className="font-semibold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Debit / Receipt (₹)', key: 'debit', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Credit / Payment (₹)', key: 'credit', render: (val) => <span className="font-mono font-bold text-rose-600">₹{val.toLocaleString()}</span> },
    { header: 'Closing Balance (₹)', key: 'balance', render: (val) => <span className="font-mono font-bold text-slate-900">₹{val.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cash Book Ledger</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Daily physical cash receipts, petty cash disbursements & cashier closing balance</p>
      </div>

      <DataTable columns={columns} data={cashEntries} />
    </div>
  );
};

export default CashBookPage;
