import React from 'react';
import PrintHeader from './PrintHeader';
import { Printer } from 'lucide-react';

export const PrintLayout = ({ title, documentNo, children }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Print Trigger Bar */}
      <div className="no-print glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Printable Document Ready</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">A4 layout formatted for official signatures and archiving.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black dark:bg-sky-600 dark:hover:bg-sky-700 rounded-xl transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document (A4)</span>
        </button>
      </div>

      {/* Printable Sheet Area */}
      <div className="print-container bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-slate-900 max-w-4xl mx-auto">
        <PrintHeader title={title} documentNo={documentNo} />
        {children}

        {/* Footer Signatures */}
        <div className="mt-16 pt-8 border-t border-slate-300 flex items-end justify-between text-xs font-semibold text-slate-800">
          <div className="text-center">
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <p>Subject Teacher Signature</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <p>HOD / Class Teacher Signature</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <p>Principal Stamp & Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;
