import React from 'react';
import { instituteInfo } from '../../data/mockData';

export const PrintHeader = ({ title, subtitle, documentNo }) => {
  return (
    <div className="w-full pb-4 border-b-2 border-slate-900 mb-6 text-center">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-1 bg-white">
            <img src={instituteInfo.logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900 leading-tight">
              {instituteInfo.name}
            </h1>
            <p className="text-[11px] text-slate-700 font-semibold">{instituteInfo.affiliation}</p>
            <p className="text-[10px] text-slate-600">{instituteInfo.accreditation}</p>
            <p className="text-[10px] text-slate-500">{instituteInfo.address}</p>
          </div>
        </div>

        {documentNo && (
          <div className="text-right border-l pl-4 border-slate-300">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ref / Doc No</p>
            <p className="text-sm font-mono font-bold text-slate-900">{documentNo}</p>
          </div>
        )}
      </div>

      {(title || subtitle) && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          {title && <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">{title}</h2>}
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

export default PrintHeader;
