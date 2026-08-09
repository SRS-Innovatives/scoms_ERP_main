import React from 'react';
import CertificateTemplate from '../../components/print/CertificateTemplate';

export const TransferCertificatePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Certificate (TC) Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Generate and print official Transfer & Conduct Certificate for departing students</p>
      </div>

      <CertificateTemplate type="tc" />
    </div>
  );
};

export default TransferCertificatePage;
