import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5 overflow-x-auto py-1">
      <Link
        to="/super-admin/dashboard"
        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors shrink-0"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Super Admin</span>
      </Link>

      {pathnames.slice(1).map((value, index) => {
        const to = `/${pathnames.slice(0, index + 2).join('/')}`;
        const isLast = index === pathnames.length - 2;
        const formatted = value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
            {isLast ? (
              <span className="font-bold text-slate-800 dark:text-slate-200 capitalize truncate">
                {formatted}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors capitalize shrink-0"
              >
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
