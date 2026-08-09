import React from 'react';
import CertificateTemplate from '../../components/print/CertificateTemplate';

export const CourseCompletionPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Course Completion Certificate Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Printable A4 Course Completion Certificate layout</p>
      </div>

      <CertificateTemplate type="completion" />
    </div>
  );
};

export default CourseCompletionPage;
