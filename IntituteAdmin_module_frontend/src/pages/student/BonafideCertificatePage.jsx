import React from 'react';
import CertificateGenerator from '../../components/print/CertificateGenerator';

export const BonafideCertificatePage = () => {
  return (
    <CertificateGenerator
      type="BONAFIDE"
      title="Bonafide Certificate Generator"
      subtitle="Generate and print official Bonafide Certificate for Bank Loans, Bus Pass & Passport"
    />
  );
};

export default BonafideCertificatePage;
