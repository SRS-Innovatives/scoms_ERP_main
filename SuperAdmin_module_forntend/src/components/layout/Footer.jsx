import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 SCOMS SaaS Platform - Multi-Tenant Enterprise ERP. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Security Center</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">SLA Status</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
