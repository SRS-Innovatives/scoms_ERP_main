import React from 'react';
import CertificateTemplate from '../../components/print/CertificateTemplate';

export const BonafideCertificatePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bonafide Certificate Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Generate and print official Bonafide Certificate for Bank Loans, Bus Pass & Passport</p>
      </div>

      <CertificateTemplate type="bonafide" />
    </div>
  );
};

export default BonafideCertificatePage;
