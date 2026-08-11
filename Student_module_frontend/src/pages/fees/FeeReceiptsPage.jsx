import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockFeeReceipts } from '../../data/mockStudentData';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { Printer, Download, QrCode } from 'lucide-react';

export const FeeReceiptsPage = () => {
  const { student } = useStudentAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <PageHeader title="Official Fee Payment Receipts" subtitle="Download and print A4 digital fee payment vouchers." />
        <button onClick={() => window.print()} className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-xl text-xs flex items-center gap-1.5">
          <Printer className="w-4 h-4" /> Print Receipt A4
        </button>
      </div>

      {mockFeeReceipts.map((rcp) => (
        <div key={rcp.id} className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 print-container max-w-3xl mx-auto">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{student?.institution}</h2>
              <p className="text-xs text-slate-500">Official Payment Voucher Receipt</p>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-1">Receipt No: {rcp.receiptNo}</p>
            </div>
            <div className="text-right text-xs">
              <StatusBadge status={rcp.status} />
              <p className="text-slate-400 mt-1">Date: {rcp.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase text-[10px]">Student Details</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{student?.name}</p>
              <p className="text-slate-500">{student?.admissionNo} • {student?.course}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px]">Transaction Info</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{rcp.paymentMode}</p>
              <p className="font-mono text-slate-500">TxnID: {rcp.txnid}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 flex justify-between items-center text-xs">
            <div>
              <p className="text-slate-500">Paid Amount:</p>
              <p className="text-2xl font-black text-emerald-600">₹{rcp.amount.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-12 h-12 text-slate-700 dark:text-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeeReceiptsPage;
