import React from 'react';
import ChallanTemplate from '../../components/print/ChallanTemplate';

export const ChallanGenerationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Offline Payment Bank Challan Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Generate 3-Fold SBI / HDFC Bank Challan (Student Copy, Bank Copy & Office Copy)</p>
      </div>

      <ChallanTemplate />
    </div>
  );
};

export default ChallanGenerationPage;
