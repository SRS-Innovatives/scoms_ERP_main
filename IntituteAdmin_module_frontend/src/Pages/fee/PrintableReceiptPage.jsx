import React from 'react';
import ReceiptTemplate from '../../components/print/ReceiptTemplate';

export const PrintableReceiptPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Receipt Printable Template</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Official institutional fee payment receipt printout with QR verification</p>
      </div>

      <ReceiptTemplate />
    </div>
  );
};

export default PrintableReceiptPage;
