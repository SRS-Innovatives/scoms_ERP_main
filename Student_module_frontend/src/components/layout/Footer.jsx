import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 no-print pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 SCOMS SaaS Educational ERP • One Digital Campus for Every Student.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-indigo-600 transition-colors">Academic Help</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Student Grievance</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Digital Library</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
