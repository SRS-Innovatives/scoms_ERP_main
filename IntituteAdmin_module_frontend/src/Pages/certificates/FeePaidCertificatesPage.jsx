import React from 'react';
import CertificateTemplate from '../../components/print/CertificateTemplate';

export const FeePaidCertificatesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Paid Clearance Certificate</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable Certificate confirming full fee clearance for IT rebate & education loan</p>
      </div>

      <CertificateTemplate type="feepaid" />
    </div>
  );
};

export default FeePaidCertificatesPage;
