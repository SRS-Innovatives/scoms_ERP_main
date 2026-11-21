import React from 'react';
import { useInstitution } from '../../context/InstitutionContext';

/** Letterhead for every Staff-portal printout — the signed-in staff member's own institution
 * (name, logo, address, board / affiliation, contact), never a fixed sample name. */
export const PrintHeader = ({ title = 'Official Institutional Document', documentNo, date }) => {
  const { institution } = useInstitution();
  const inst = institution || {};
  const address = [inst.address, inst.city, inst.district, inst.state, inst.pincode].filter(Boolean).join(', ');
  const recognition = inst.board || inst.affiliatedUniversity?.name || inst.university || inst.affiliation || null;
  const contact = [inst.phone && `Ph: ${inst.phone}`, inst.email, inst.website].filter(Boolean).join(' • ');

  return (
    <div className="border-b-2 border-slate-900 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 text-left min-w-0">
          {inst.logo && <img src={inst.logo} alt="" className="w-14 h-14 object-contain shrink-0" />}
          <div className="min-w-0">
            <p className="text-base font-black uppercase tracking-wide text-slate-900 leading-tight">{inst.name || ''}</p>
            {address && <p className="text-[10px] text-slate-600">{address}</p>}
            {recognition && <p className="text-[10px] text-slate-600">{recognition}</p>}
            {contact && <p className="text-[10px] text-slate-500">{contact}</p>}
          </div>
        </div>
        <div className="text-right text-xs font-semibold text-slate-700 shrink-0">
          {documentNo && <p>Doc No: <span className="font-mono">{documentNo}</span></p>}
          <p>Date: {date || new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <h1 className="text-xl font-black uppercase tracking-wide text-slate-900 text-center">{title}</h1>
    </div>
  );
};

export default PrintHeader;
