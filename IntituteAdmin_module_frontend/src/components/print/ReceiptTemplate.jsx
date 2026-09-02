import React from 'react';
import PrintHeader from '../common/PrintHeader';
import { Printer, Download, Share2, Mail, MessageSquare } from 'lucide-react';

export const ReceiptTemplate = ({ receiptData, onPrint }) => {
  const data = receiptData || {
    receiptNo: "REC/2025/04921",
    date: "2025-08-08",
    studentName: "Kavitha R. Sharma",
    rollNo: "21CS101",
    regNo: "311521104001",
    course: "B.E. Computer Science & Engineering",
    academicYear: "2025 - 2026",
    semester: "Semester 6",
    items: [
      { name: "Tuition Fee (Sem 6)", amount: 42500 },
      { name: "University Examination & Registration Fee", amount: 3500 }
    ],
    totalAmount: 46000,
    amountInWords: "Forty Six Thousand Rupees Only",
    paymentMode: "UPI / GPay",
    transactionId: "UPI/382049182749",
    collectedBy: "G. Murugesan (Senior Accountant)"
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {/* Printable Receipt Card */}
      <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl max-w-3xl mx-auto print-container my-6">
        <PrintHeader title="OFFICIAL FEE PAYMENT RECEIPT" subtitle="Student Copy / Office Record" documentNo={data.receiptNo} />

        <div className="grid grid-cols-2 gap-4 mb-6 text-xs border-b border-slate-200 pb-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Student Name</p>
            <p className="font-bold text-sm text-slate-900">{data.studentName}</p>
            <p className="text-slate-600 mt-1">Roll No: <span className="font-semibold text-slate-900">{data.rollNo}</span> | Reg No: <span className="font-semibold text-slate-900">{data.regNo}</span></p>
            <p className="text-slate-600">{data.course}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Payment Date</p>
            <p className="font-bold text-sm text-slate-900">{data.date}</p>
            <p className="text-slate-600 mt-1">Academic Year: <span className="font-semibold">{data.academicYear}</span></p>
            <p className="text-slate-600">Semester: <span className="font-semibold">{data.semester}</span></p>
          </div>
        </div>

        {/* Breakdown Table */}
        <table className="w-full text-xs text-left mb-6 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
              <th className="p-3 border-r border-slate-300">#</th>
              <th className="p-3 border-r border-slate-300">Fee Head / Description</th>
              <th className="p-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td className="p-3 border-r border-slate-300 w-10 font-mono text-center">{idx + 1}</td>
                <td className="p-3 border-r border-slate-300 font-semibold">{item.name}</td>
                <td className="p-3 text-right font-mono font-bold">₹{item.amount.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold text-sm border-t-2 border-slate-900">
              <td colSpan={2} className="p-3 text-right border-r border-slate-300 uppercase">Total Paid Amount:</td>
              <td className="p-3 text-right font-mono text-indigo-900">₹{data.totalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words & payment details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs space-y-2">
          <p><span className="font-semibold text-slate-700">Amount in Words:</span> <span className="font-bold text-slate-900 italic">{data.amountInWords}</span></p>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <p><span className="font-semibold text-slate-700">Payment Mode:</span> <span className="font-bold text-indigo-700">{data.paymentMode}</span></p>
            <p><span className="font-semibold text-slate-700">Ref / Txn ID:</span> <span className="font-mono font-bold text-slate-900">{data.transactionId}</span></p>
          </div>
        </div>

        {/* Signatures & Footer Note */}
        <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-xs">
          <div className="text-center">
            <div className="w-24 h-12 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center text-[10px] text-slate-400 font-mono">
              [QR VERIFIED]
            </div>
            <p className="text-[10px] font-semibold text-slate-600">Scan to Verify Authenticity</p>
          </div>

          <div className="text-center">
            <p className="text-slate-600 font-medium mb-1">Cashier / Authorized Officer</p>
            <p className="font-bold text-slate-900">{data.collectedBy}</p>
            <p className="text-[10px] text-slate-500 mt-6 pt-1 border-t border-slate-400 w-44 mx-auto">Seal & Signature</p>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-6 pt-4 border-t border-slate-200 italic">
          * This is a computer-generated official receipt. No manual signature is strictly required for electronic verification.
        </p>
      </div>

      {/* Action Buttons (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-center gap-3 no-print mt-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Send WhatsApp</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs transition-colors">
          <Mail className="w-4 h-4" />
          <span>Send Email</span>
        </button>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
