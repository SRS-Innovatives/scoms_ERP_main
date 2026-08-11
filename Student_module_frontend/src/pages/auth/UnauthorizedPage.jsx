import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/90 text-white text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">403 - Access Restricted</h2>
        <p className="text-xs text-slate-400">You do not have student permissions to access this campus module.</p>
        <Link to="/student/dashboard" className="inline-block px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl text-xs">
          Return to Student Dashboard
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
