import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import ReceiptTemplate from '../../components/print/ReceiptTemplate';
import { useNotification } from '../../context/NotificationContext';
import { Search, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';

const PAYMENT_MODES = ['CASH', 'UPI_MANUAL', 'ONLINE_CARD', 'BANK_TRANSFER', 'CHEQUE', 'DD'];

export const CollectFeePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [payingMap, setPayingMap] = useState({});
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [receipt, setReceipt] = useState(null);

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
      const assignRes = await feeService.getAssignments({ studentId: found.id });
      const dues = (assignRes.data || []).filter((a) => a.status !== 'PAID');
      setAssignments(dues);
      const initial = {};
      dues.forEach((a) => { initial[a.id] = a.dueAmount; });
      setPayingMap(initial);
    } catch (error) {
      notifyError(`Search failed: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const totalPaying = assignments.reduce((acc, a) => acc + Number(payingMap[a.id] || 0), 0);
  const totalBalanceLeft = assignments.reduce((acc, a) => acc + Math.max(0, a.dueAmount - Number(payingMap[a.id] || 0)), 0);

  const handleCollect = async (e) => {
    e.preventDefault();
    const toCollect = assignments.filter((a) => Number(payingMap[a.id]) > 0);
    if (toCollect.length === 0) return;
    setCollecting(true);
    try {
      let lastResult = null;
      for (const a of toCollect) {
        lastResult = await feeService.collectFee({
          studentId: selectedStudent.id,
          studentFeeAssignmentId: a.id,
          amountPaid: Number(payingMap[a.id]),
          paymentMode,
          transactionReference: txnRef,
          remarks,
        });
      }
      notifySuccess(`Collected ₹${totalPaying.toLocaleString()} from ${selectedStudent.firstName} ${selectedStudent.lastName}! Receipt generated.`, 'Fee Collected');
      setReceipt({
        receiptNo: lastResult.data.receipt.receiptNumber,
        date: new Date().toISOString().split('T')[0],
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        rollNo: selectedStudent.rollNumber,
        regNo: selectedStudent.admissionNumber,
        course: selectedStudent.course?.name || '',
        academicYear: '',
        semester: selectedStudent.section?.name || '',
        items: toCollect.map((a) => ({ name: a.feeStructure?.name, amount: Number(payingMap[a.id]) })),
        totalAmount: totalPaying,
        amountInWords: `${totalPaying.toLocaleString()} Rupees Only`,
        paymentMode,
        transactionId: txnRef || lastResult.data.receipt.receiptNumber,
        collectedBy: 'Fee Counter',
      });
      const assignRes = await feeService.getAssignments({ studentId: selectedStudent.id });
      setAssignments((assignRes.data || []).filter((a) => a.status !== 'PAID'));
    } catch (error) {
      notifyError(`Failed to collect fee: ${error.message}`);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Counter POS & Payment Collection</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Collect fees via Cash, UPI, Card, Bank Transfer, Cheque or DD against a student's pending assignments</p>
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
            <p className="text-slate-400 font-semibold">Pending Assignments</p>
            <p className="font-bold text-rose-600">{assignments.length}</p>
          </div>
        </div>
      )}

      {selectedStudent && assignments.length > 0 && (
        <form onSubmit={handleCollect} className="space-y-6">
          <FormSection title="Fee Heads Breakdown & Collecting Amount">
            <table className="w-full text-xs text-left mb-4 border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                  <th className="p-3 border-r">Fee Structure</th>
                  <th className="p-3 border-r text-right">Total (₹)</th>
                  <th className="p-3 border-r text-right">Already Paid (₹)</th>
                  <th className="p-3 border-r text-right">Balance Due (₹)</th>
                  <th className="p-3 text-right w-40">Amount Paying Now (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white border-r">{a.feeStructure?.name}</td>
                    <td className="p-3 text-right font-mono font-semibold border-r">₹{a.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold border-r">₹{a.paidAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-600 font-semibold border-r">₹{a.dueAmount.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        max={a.dueAmount}
                        min={0}
                        value={payingMap[a.id] ?? ''}
                        onChange={(e) => setPayingMap((prev) => ({ ...prev, [a.id]: e.target.value }))}
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

      {selectedStudent && assignments.length === 0 && !receipt && (
        <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          No pending fee dues for this student.
        </div>
      )}

      {receipt && (
        <div className="pt-6 border-t-2 border-dashed border-indigo-300">
          <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5" /> Official Fee Receipt Generated Successfully
          </h3>
          <ReceiptTemplate receiptData={receipt} />
        </div>
      )}
    </div>
  );
};

export default CollectFeePage;
