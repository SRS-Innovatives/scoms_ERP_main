import React from 'react';
import { Link } from 'react-router-dom';
import { useInstitution } from '../../context/InstitutionContext';

// Each link only shows when the institution has the module it points to
const FOOTER_LINKS = [
  { label: 'Academic Help', path: '/student/appointments', module: 'counselling' },
  { label: 'Student Grievance', path: '/student/grievances', module: 'grievance_feedback' },
  { label: 'Digital Library', path: '/student/library', module: 'library' },
];

export const Footer = () => {
  const { institution, isModuleEnabled } = useInstitution();
  const links = FOOTER_LINKS.filter((l) => isModuleEnabled(l.module));

  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 no-print pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} {institution?.name || 'SCOMS'} • Powered by SCOMS Educational ERP</p>
        {links.length > 0 && (
          <div className="flex items-center gap-4">
            {links.map((l) => (
              <Link key={l.path} to={l.path} className="hover:text-indigo-600 transition-colors">{l.label}</Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
