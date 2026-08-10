import React from 'react';

export const PrintHeader = ({ title = 'Official Institutional Document', documentNo, date }) => {
  return (
    <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
      <div className="flex items-center justify-between mb-2">
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">SCOMS Educational ERP</span>
          <p className="text-[10px] text-slate-500">Affiliated to State Board & CBSE / UGC Approved</p>
        </div>
        <div className="text-right text-xs font-semibold text-slate-700">
          {documentNo && <p>Doc No: <span className="font-mono">{documentNo}</span></p>}
          <p>Date: {date || new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">{title}</h1>
      <p className="text-xs text-slate-600 font-medium mt-0.5">SCOMS International Academy & Science College • Bengaluru Campus</p>
    </div>
  );
};

export default PrintHeader;
