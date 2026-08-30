import React from 'react';
import { useInstitution } from '../../context/InstitutionContext';

export const PrintHeader = ({ title, subtitle, documentNo }) => {
  const { institution } = useInstitution();
  const address = [institution?.address, institution?.city, institution?.state].filter(Boolean).join(', ');

  return (
    <div className="w-full pb-4 border-b-2 border-slate-900 mb-6 text-center">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-1 bg-white">
            {institution?.logo ? (
              <img src={institution.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-lg font-bold text-slate-400">{(institution?.code || institution?.name || 'S').charAt(0)}</span>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900 leading-tight">
              {institution?.name || 'Institution'}
            </h1>
            {institution?.affiliation && <p className="text-[11px] text-slate-700 font-semibold">{institution.affiliation}</p>}
            {address && <p className="text-[10px] text-slate-500">{address}</p>}
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
