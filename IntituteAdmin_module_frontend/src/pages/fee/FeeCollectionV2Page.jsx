import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import ReceiptTemplate from '../../components/print/ReceiptTemplate';
import { useNotification } from '../../context/NotificationContext';
import { Search, CreditCard, CheckCircle2, Loader2, Printer } from 'lucide-react';
import feeEngineService from '../../services/feeEngineService';
import studentService from '../../services/studentService';

const PAYMENT_MODES = ['CASH', 'UPI_MANUAL', 'ONLINE_CARD', 'BANK_TRANSFER', 'CHEQUE', 'DD'];

export const FeeCollectionV2Page = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [items, setItems] = useState([]); // flattened StudentFeeItem rows, each carrying its parent structure name
  const [payingMap, setPayingMap] = useState({});
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [reprinting, setReprinting] = useState(false);

  const loadItems = async (studentId) => {
    const res = await feeEngineService.getStudentFeeItems(studentId);
    const flattened = (res.data || []).flatMap((assignment) =>
      (assignment.items || [])
        .filter((item) => item.status !== 'PAID')
        .map((item) => ({ ...item, structureName: assignment.feeStructure?.name }))
    );
    setItems(flattened);
    const initial = {};
    flattened.forEach((item) => { initial[item.id] = item.dueAmount; });
    setPayingMap(initial);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setReceipt(null);
    try {
      const res = await studentService.getAll({ search: searchQuery, limit: 1 });
      const found = (res.data || [])[0];
      if (!found) {
        notifyError('No student found for that roll number / name.');
        setSelectedStudent(null);
        return;
      }
      setSelectedStudent(found);
      await loadItems(found.id);
    } catch (error) {
      notifyError(`Search failed: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const totalPaying = items.reduce((acc, item) => acc + Number(payingMap[item.id] || 0), 0);
  const totalBalanceLeft = items.reduce((acc, item) => acc + Math.max(0, item.dueAmount - Number(payingMap[item.id] || 0)), 0);

  const handleCollect = async (e) => {
    e.preventDefault();
    const allocations = items
      .filter((item) => Number(payingMap[item.id]) > 0)
      .map((item) => ({ studentFeeItemId: item.id, amount: Number(payingMap[item.id]) }));
    if (allocations.length === 0) return;
    setCollecting(true);
    try {
      const res = await feeEngineService.collectPayment({
        studentId: selectedStudent.id,
        allocations,
        paymentMode,
        transactionReference: txnRef,
        remarks,
      });
      const { receipt: receiptRow, allocations: paidAllocations } = res.data;
      notifySuccess(`Collected ₹${totalPaying.toLocaleString()} from ${selectedStudent.firstName} ${selectedStudent.lastName}! Receipt generated.`, 'Fee Collected');
      setReceipt({
        id: receiptRow.id,
        receiptNo: receiptRow.receiptNumber,
        date: new Date().toISOString().split('T')[0],
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        rollNo: selectedStudent.rollNumber,
        regNo: selectedStudent.admissionNumber,
        course: selectedStudent.course?.name || '',
        academicYear: '',
        semester: selectedStudent.section?.name || '',
        items: paidAllocations.map((a) => ({ name: a.feeHeadName, amount: Number(a.amount) })),
        totalAmount: totalPaying,
        amountInWords: `${totalPaying.toLocaleString()} Rupees Only`,
        paymentMode,
        transactionId: txnRef || receiptRow.receiptNumber,
        collectedBy: 'Fee Counter',
      });
      await loadItems(selectedStudent.id);
    } catch (error) {
      notifyError(`Failed to collect fee: ${error.message}`);
    } finally {
      setCollecting(false);
    }
  };

  const handleReprint = async () => {
    if (!receipt?.id) return;
    setReprinting(true);
    try {
      await feeEngineService.reprintReceipt(receipt.id);
      notifySuccess('Receipt reprint logged.');
      window.print();
    } catch (error) {
      notifyError(`Reprint failed: ${error.message}`);
    } finally {
      setReprinting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Collection (Dynamic Engine)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Collect against per-head fee items from a published, assigned Fee Structure — supports partial, multi-head payments in one receipt</p>
      </div>

      <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs glass-card">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Student Roll No, Admission No, or Name..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button onClick={handleSearch} disabled={searching} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
          {searching ? 'Searching...' : 'Search Student'}
        </button>
      </div>

      {selectedStudent && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
            <p className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Roll: {selectedStudent.rollNumber} | Adm: {selectedStudent.admissionNumber}</p>
            <p className="text-slate-500">{selectedStudent.course?.name}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold">Section</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.section?.name || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold">Pending Fee Items</p>
            <p className="font-bold text-rose-600">{items.length}</p>
          </div>
        </div>
      )}

      {selectedStudent && items.length > 0 && (
        <form onSubmit={handleCollect} className="space-y-6">
          <FormSection title="Fee Head Breakdown & Collecting Amount">
            <table className="w-full text-xs text-left mb-4 border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                  <th className="p-3 border-r">Fee Structure</th>
                  <th className="p-3 border-r">Fee Head</th>
                  <th className="p-3 border-r text-right">Already Paid (₹)</th>
                  <th className="p-3 border-r text-right">Balance Due (₹)</th>
                  <th className="p-3 text-right w-40">Amount Paying Now (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 text-slate-500 border-r">{item.structureName}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white border-r">{item.feeHeadName}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold border-r">₹{item.paidAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-600 font-semibold border-r">₹{item.dueAmount.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        max={item.dueAmount}
                        min={0}
                        value={payingMap[item.id] ?? ''}
                        onChange={(e) => setPayingMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-right text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <p className="text-slate-500">Total Paying Amount Now:</p>
                <p className="text-2xl font-black font-mono text-indigo-900 dark:text-indigo-200">₹{totalPaying.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Remaining Outstanding Balance After Payment:</p>
                <p className={`text-lg font-bold font-mono ${totalBalanceLeft > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{totalBalanceLeft.toLocaleString()}</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Select Payment Mode & Transaction Reference" icon={CreditCard}>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    paymentMode === mode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / Cheque / DD No</label>
                <input type="text" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. UPI/8492019482" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-medium" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Accounts Remarks / Note</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks..." className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
              </div>
            </div>
          </FormSection>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={collecting || totalPaying <= 0} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50">
              {collecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>{collecting ? 'Processing...' : 'Process Payment & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      )}

      {selectedStudent && items.length === 0 && !receipt && (
        <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          No pending dynamic-engine fee items for this student — either nothing is assigned yet, or everything is fully paid.
        </div>
      )}

      {receipt && (
        <div className="pt-6 border-t-2 border-dashed border-indigo-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Official Fee Receipt Generated Successfully
            </h3>
            <button onClick={handleReprint} disabled={reprinting} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50">
              <Printer className="w-3.5 h-3.5" /> {reprinting ? 'Logging...' : 'Reprint'}
            </button>
          </div>
          <ReceiptTemplate receiptData={receipt} />
        </div>
      )}
    </div>
  );
};

export default FeeCollectionV2Page;
