import React from 'react';
import CertificateTemplate from '../../components/print/CertificateTemplate';

export const ConductCertificatesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Conduct & Character Certificate Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable Conduct Certificate for employment & higher studies</p>
      </div>

      <CertificateTemplate type="conduct" />
    </div>
  );
};

export default ConductCertificatesPage;
