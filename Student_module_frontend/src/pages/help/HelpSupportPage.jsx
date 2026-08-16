import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { HelpCircle, Phone, Mail } from 'lucide-react';

export const HelpSupportPage = () => {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <PageHeader title="Student Help & Support Desk" subtitle="Technical help and IT administrator contact." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-500" /> Need Help with Portal?
        </h3>
        <p className="text-slate-500">Contact College IT Support Desk for login issues or mark corrections:</p>
        <p className="font-bold flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-500" /> support@srilakshmicollege.ac.in</p>
        <p className="font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-500" /> +91 44 2819 0042 (Ext: 104)</p>
      </div>
    </div>
  );
};

export default HelpSupportPage;
