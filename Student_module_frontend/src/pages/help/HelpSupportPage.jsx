import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useInstitution } from '../../context/InstitutionContext';
import { HelpCircle, Phone, Mail } from 'lucide-react';

export const HelpSupportPage = () => {
  const { institution } = useInstitution();

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <PageHeader title="Student Help & Support Desk" subtitle="Contact your institution's administration for login issues or record corrections." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-500" /> Need Help with the Portal?
        </h3>
        <p className="text-slate-500">Contact {institution?.name || 'your institution'}'s administration office:</p>
        {institution?.email ? (
          <p className="font-bold flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {institution.email}</p>
        ) : (
          <p className="text-slate-400">Email not on file for your institution yet.</p>
        )}
        {institution?.phone ? (
          <p className="font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-500" /> {institution.phone}</p>
        ) : (
          <p className="text-slate-400">Phone number not on file for your institution yet.</p>
        )}
      </div>
    </div>
  );
};

export default HelpSupportPage;
