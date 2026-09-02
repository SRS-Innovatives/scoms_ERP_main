import React from 'react';
import CertificateGenerator from '../../components/print/CertificateGenerator';

export const TransferCertificatePage = () => {
  return (
    <CertificateGenerator
      type="TC"
      title="Transfer Certificate (TC) Generator"
      subtitle="Generate and print official Transfer & Conduct Certificate for departing students"
      extraFields={[
        { name: 'dateOfLeaving', label: 'Date of Leaving', placeholder: 'e.g. 31/05/2026' },
        { name: 'reasonForLeaving', label: 'Reason for Leaving', placeholder: 'e.g. Course Completed' },
        { name: 'conduct', label: 'Character & Conduct', placeholder: 'e.g. GOOD' },
      ]}
    />
  );
};

export default TransferCertificatePage;
