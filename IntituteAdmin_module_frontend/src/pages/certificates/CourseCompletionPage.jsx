import React from 'react';
import CertificateGenerator from '../../components/print/CertificateGenerator';

export const CourseCompletionPage = () => {
  return (
    <CertificateGenerator
      type="COMPLETION"
      title="Course Completion Certificate Generator"
      subtitle="Printable A4 Course Completion Certificate layout"
    />
  );
};

export default CourseCompletionPage;
