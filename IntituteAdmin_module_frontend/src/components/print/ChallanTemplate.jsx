import React from 'react';
import { Printer, Download } from 'lucide-react';
import { instituteInfo } from '../../data/mockData';

export const ChallanTemplate = ({ challanData }) => {
  const data = challanData || {
    challanNo: "CHLN/2025/849201",
    issueDate: "2025-08-05",
    dueDate: "2025-08-25",
    studentName: "Aditya V. Karthik",
    rollNo: "21CS102",
    regNo: "311521104002",
    course: "B.E. Computer Science & Engineering - 3rd Year",
    bankName: instituteInfo.bankDetails.bankName,
    branch: instituteInfo.bankDetails.branch,
    accountName: instituteInfo.bankDetails.accountName,
    accountNo: instituteInfo.bankDetails.accountNumber,
    ifscCode: instituteInfo.bankDetails.ifscCode,
    items: [
      { feeHead: "Tuition Fee (Balance Instalment)", amount: 21500 },
      { feeHead: "Semester Exam Fee", amount: 3500 }
    ],
    totalAmount: 25000
  };

  const handlePrint = () => {
    window.print();
  };

  const copies = ["BANK COPY", "INSTITUTE COPY", "STUDENT COPY"];

  return (
    <div className="w-full">
      {/* 3-Part Bank Challan Printable Sheet */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 shadow-xl max-w-5xl mx-auto print-container my-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300 gap-4">
          {copies.map((copyType, cIdx) => (
            <div key={cIdx} className="p-3 text-[11px] flex flex-col justify-between space-y-3">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                  <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
                    {copyType}
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-[10px]">{data.challanNo}</span>
                </div>

                <div className="text-center mb-3">
                  <h3 className="font-bold uppercase text-slate-900 text-xs leading-tight">{instituteInfo.shortName}</h3>
                  <p className="text-[10px] text-slate-600 font-semibold">{data.bankName}</p>
                  <p className="text-[9px] text-slate-500">{data.branch}</p>
                </div>

                {/* Bank Account Info */}
                <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3 text-[10px]">
                  <p><span className="text-slate-500">A/C Name:</span> <span className="font-semibold">{data.accountName}</span></p>
                  <p><span className="text-slate-500">A/C No:</span> <span className="font-mono font-bold">{data.accountNo}</span></p>
                  <p><span className="text-slate-500">IFSC:</span> <span className="font-mono font-semibold">{data.ifscCode}</span></p>
                </div>

                {/* Student Info */}
                <div className="space-y-1 mb-3 text-[10px]">
                  <p><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-900">{data.studentName}</span></p>
                  <p><span className="text-slate-500">Roll / Reg No:</span> <span className="font-mono font-semibold">{data.rollNo} / {data.regNo}</span></p>
                  <p><span className="text-slate-500">Course:</span> <span className="font-semibold">{data.course}</span></p>
                  <p><span className="text-slate-500">Issue Date:</span> <span className="font-semibold">{data.issueDate}</span> | <span className="text-rose-600 font-bold">Due: {data.dueDate}</span></p>
                </div>

                {/* Items */}
                <table className="w-full border border-slate-300 text-[10px] mb-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="p-1 border-r border-slate-300">Fee Particulars</th>
                      <th className="p-1 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1 border-r border-slate-300 font-medium">{item.feeHead}</td>
                        <td className="p-1 text-right font-mono font-semibold">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800">
                      <td className="p-1 border-r border-slate-300 text-right">TOTAL:</td>
                      <td className="p-1 text-right font-mono text-indigo-900">₹{data.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cash Denomination & Signatures */}
              <div className="pt-2 border-t border-slate-300 space-y-3">
                <div className="text-[9px] text-slate-500">
                  <p className="font-semibold text-slate-700">Denominations (for cash):</p>
                  <p>2000x__ 500x__ 200x__ 100x__</p>
                </div>

                <div className="flex justify-between items-end pt-4 text-[9px]">
                  <div className="text-center">
                    <p className="border-t border-slate-400 w-16 pt-0.5 font-semibold text-slate-700">Remitter Sign</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-slate-400 w-16 pt-0.5 font-semibold text-slate-700">Bank Seal & Sign</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 no-print mt-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print 3-Part Bank Challan</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Save as PDF</span>
        </button>
      </div>
    </div>
  );
};

export default ChallanTemplate;
