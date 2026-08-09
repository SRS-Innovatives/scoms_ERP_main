import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import ReceiptTemplate from '../../components/print/ReceiptTemplate';
import { studentsList } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { Search, CreditCard, CheckCircle2, Printer, ArrowRight, DollarSign, Wallet } from 'lucide-react';

export const CollectFeePage = () => {
  const { notifySuccess } = useNotification();
  const [searchRoll, setSearchRoll] = useState('21CS101');
  const [selectedStudent, setSelectedStudent] = useState(studentsList[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txnRef, setTxnRef] = useState('UPI/984029184920');
  const [remarks, setRemarks] = useState('Even Semester Tuition Fee Paid via GPay');
  const [showReceipt, setShowReceipt] = useState(false);

  const [feeItems, setFeeItems] = useState([
    { name: 'Tuition Fee (Sem 6)', total: 42500, paid: 20000, paying: 22500 },
    { name: 'University Examination Fee', total: 3500, paid: 0, paying: 3500 }
  ]);

  const handleSearch = () => {
    const found = studentsList.find(
      (s) => s.rollNo.toLowerCase() === searchRoll.toLowerCase() || s.name.toLowerCase().includes(searchRoll.toLowerCase())
    );
    if (found) {
      setSelectedStudent(found);
      notifySuccess(`Loaded student profile for ${found.name}`);
    }
  };

  const totalPaying = feeItems.reduce((acc, curr) => acc + Number(curr.paying || 0), 0);
  const totalBalanceLeft = feeItems.reduce((acc, curr) => acc + (curr.total - curr.paid - Number(curr.paying || 0)), 0);

  const handleCollect = (e) => {
    e.preventDefault();
    notifySuccess(`Collected ₹${totalPaying.toLocaleString()} from ${selectedStudent.name}! Receipt generated.`, 'Fee Collected');
    setShowReceipt(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Counter POS & Payment Collection</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Collect tuition, exam, hostel & bus fees via Cash, UPI, Card, Bank Transfer, Cheque or DD</p>
      </div>

      {/* Student Lookup Search Bar */}
      <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs glass-card">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
            placeholder="Enter Student Roll No, Reg No, or Name (e.g. 21CS101)..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
        >
          Search Student
        </button>
      </div>

      {/* Student Summary Banner */}
      {selectedStudent && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <img src={selectedStudent.photo} alt="Student" className="w-12 h-12 rounded-xl object-cover border" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedStudent.name}</h3>
              <p className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Roll: {selectedStudent.rollNo} | Reg: {selectedStudent.regNo}</p>
              <p className="text-slate-500">{selectedStudent.course}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-400 font-semibold">Parent & Contact</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.fatherName}</p>
            <p className="font-mono text-slate-600">{selectedStudent.parentPhone}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold">Scholarship Waiver</p>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">{selectedStudent.scholarship}</p>
          </div>
        </div>
      )}

      {/* Fee Breakdown & Payment Collector Form */}
      <form onSubmit={handleCollect} className="space-y-6">
        <FormSection title="Fee Heads Breakdown & Collecting Amount">
          <table className="w-full text-xs text-left mb-4 border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                <th className="p-3 border-r">Fee Particulars</th>
                <th className="p-3 border-r text-right">Total Prescribed (₹)</th>
                <th className="p-3 border-r text-right">Already Paid (₹)</th>
                <th className="p-3 border-r text-right">Balance Dues (₹)</th>
                <th className="p-3 text-right w-40">Amount Paying Now (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {feeItems.map((item, idx) => {
                const bal = item.total - item.paid;
                return (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white border-r">{item.name}</td>
                    <td className="p-3 text-right font-mono font-semibold border-r">₹{item.total.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold border-r">₹{item.paid.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-600 font-semibold border-r">₹{bal.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        value={item.paying}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFeeItems(feeItems.map((f, i) => (i === idx ? { ...f, paying: val } : f)));
                        }}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-right text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Balance Calculation Banner */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <p className="text-slate-500">Total Paying Amount Now:</p>
              <p className="text-2xl font-black font-mono text-indigo-900 dark:text-indigo-200">₹{totalPaying.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Remaining Outstanding Balance After Payment:</p>
              <p className={`text-lg font-bold font-mono ${totalBalanceLeft > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{totalBalanceLeft.toLocaleString()}
              </p>
            </div>
          </div>
        </FormSection>

        {/* Payment Modes */}
        <FormSection title="Select Payment Mode & Transaction Reference" icon={CreditCard}>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4">
            {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'DD'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  paymentMode === mode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / Cheque / DD No *</label>
              <input
                type="text"
                required
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. UPI/8492019482 or CHQ-004920"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Accounts Remarks / Note</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>
        </FormSection>

        {/* Submit & Generate Receipt Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xl transition-all active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Process Payment & Generate Receipt</span>
          </button>
        </div>
      </form>

      {/* Generated Printable Receipt Modal / Inline View */}
      {showReceipt && (
        <div className="pt-6 border-t-2 border-dashed border-indigo-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Official Fee Receipt Generated Successfully
            </h3>
            <button
              onClick={() => setShowReceipt(false)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Close Receipt Preview
            </button>
          </div>
          <ReceiptTemplate
            receiptData={{
              receiptNo: `REC/2025/${Math.floor(10000 + Math.random() * 90000)}`,
              date: new Date().toISOString().split('T')[0],
              studentName: selectedStudent.name,
              rollNo: selectedStudent.rollNo,
              regNo: selectedStudent.regNo,
              course: selectedStudent.course,
              academicYear: '2025 - 2026',
              semester: selectedStudent.yearSem,
              items: feeItems.map((f) => ({ name: f.name, amount: Number(f.paying) })),
              totalAmount: totalPaying,
              amountInWords: `${totalPaying.toLocaleString()} Rupees Only`,
              paymentMode: paymentMode,
              transactionId: txnRef,
              collectedBy: 'G. Murugesan (Senior Accountant)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CollectFeePage;
