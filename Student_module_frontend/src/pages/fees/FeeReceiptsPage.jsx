import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Printer, QrCode, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const FeeReceiptsPage = () => {
  const { student } = useStudentAuth();
  const { error: showError } = useNotification();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feeService.getFees()
      .then((res) => {
        const flattened = (res.data || [])
          .flatMap((a) => a.payments.map((p) => ({ ...p, feeStructureName: a.feeStructure?.name })))
          .filter((p) => p.receipt)
          .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
        setReceipts(flattened);
      })
      .catch((err) => showError(err.message || 'Failed to load fee receipts', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <PageHeader title="Official Fee Payment Receipts" subtitle="Every payment you've made, with its official receipt number." />
        {receipts.length > 0 && (
          <button onClick={() => window.print()} className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-xl text-xs flex items-center gap-1.5">
            <Printer className="w-4 h-4" /> Print Receipts
          </button>
        )}
      </div>

      {receipts.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No payments recorded yet.
        </div>
      ) : (
        receipts.map((p) => (
          <div key={p.id} className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 bg-white dark:bg-slate-900 print-container max-w-3xl mx-auto">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{student?.institution}</h2>
                <p className="text-xs text-slate-500">Official Payment Voucher Receipt — {p.feeStructureName}</p>
                <p className="text-xs font-mono font-bold text-indigo-600 mt-1">Receipt No: {p.receipt.receiptNumber}</p>
              </div>
              <div className="text-right text-xs">
                <StatusBadge status={p.paymentStatus} />
                <p className="text-slate-400 mt-1">Date: {new Date(p.paidAt).toLocaleDateString('en-IN')}</p>
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
                <p className="font-bold text-slate-900 dark:text-slate-100">{p.paymentMode?.replace('_', ' ')}</p>
                <p className="font-mono text-slate-500">TxnID: {p.transactionReference || '—'}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-500">Paid Amount:</p>
                <p className="text-2xl font-black text-emerald-600">₹{p.amountPaid.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-12 h-12 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FeeReceiptsPage;
