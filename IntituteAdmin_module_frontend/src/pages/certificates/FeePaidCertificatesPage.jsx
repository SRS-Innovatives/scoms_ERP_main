import React from 'react';
import CertificateGenerator from '../../components/print/CertificateGenerator';

export const FeePaidCertificatesPage = () => {
  return (
    <CertificateGenerator
      type="FEEPAID"
      title="Fee Paid Clearance Certificate"
      subtitle="Printable Certificate confirming full fee clearance for IT rebate & education loan"
    />
  );
};

export default FeePaidCertificatesPage;
