import React, { useState } from 'react';
import ReceiptTemplate from '../../components/print/ReceiptTemplate';
import { useNotification } from '../../context/NotificationContext';
import { Search, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';

export const PrintableReceiptPage = () => {
  const { notifyError } = useNotification();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await feeService.getReceipt(query.trim());
      const r = res.data;
      setReceipt({
        receiptNo: r.receiptNumber,
        date: new Date(r.issuedAt).toISOString().split('T')[0],
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        rollNo: r.student.rollNumber,
        regNo: r.student.admissionNumber,
        course: r.student.course?.name || '',
        academicYear: '',
        semester: '',
        items: [{ name: r.payment.remarks || 'Fee Payment', amount: r.amount }],
        totalAmount: r.amount,
        amountInWords: `${r.amount.toLocaleString()} Rupees Only`,
        paymentMode: r.payment.paymentMode,
        transactionId: r.payment.transactionReference || r.receiptNumber,
        collectedBy: r.payment.receivedBy || 'Fee Counter',
      });
    } catch (error) {
      notifyError(`Receipt not found: ${error.message}`);
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Receipt Reprint</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Look up any previously issued receipt by its receipt number to reprint</p>
      </div>

      <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs glass-card max-w-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Receipt Number (e.g. SCOMS/2026/00001)..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button onClick={handleSearch} disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Receipt'}
        </button>
      </div>

      {receipt ? (
        <ReceiptTemplate receiptData={receipt} />
      ) : (
        <div className="p-10 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl">
          Search a receipt number to view and reprint it.
        </div>
      )}
    </div>
  );
};

export default PrintableReceiptPage;
