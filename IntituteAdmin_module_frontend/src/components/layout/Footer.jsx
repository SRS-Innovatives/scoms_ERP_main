import React from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
  const { institution } = useInstitution();
  return (
    <footer className="py-4 px-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 no-print mt-auto">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800 dark:text-slate-200">{institution?.code || institution?.name || 'SCOMS'}</span>
        <span>© {new Date().getFullYear()} SCOMS ERP Platform. All Rights Reserved.</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3 h-3" /> System Operational
        </span>
        <span>v3.4.0-Enterprise</span>
      </div>
    </footer>
  );
};

export default Footer;
