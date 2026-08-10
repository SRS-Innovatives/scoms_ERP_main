import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 SCOMS - School College Management System. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Staff Helpdesk</a>
          <a href="#" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">IT Support</a>
          <a href="#" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">System Status</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
