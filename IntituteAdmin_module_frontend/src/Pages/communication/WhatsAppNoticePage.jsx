import React from 'react';
import FormSection from '../../components/common/FormSection';
import { MessageSquare, CheckCircle2 } from 'lucide-react';

export const WhatsAppNoticePage = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Business API Integration Placeholder</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Meta WhatsApp Cloud API integration for automated receipt PDF & absentee alerts</p>
      </div>

      <FormSection title="WhatsApp Cloud API Status" icon={MessageSquare}>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 text-xs space-y-2">
          <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> WhatsApp Business API Meta Verified (+91 44 2847 9900)</p>
          <p className="text-slate-600 dark:text-slate-400">Templates Approved: Fee Receipt PDF, Hall Ticket Download, Absentee Parent Notification.</p>
        </div>
      </FormSection>
    </div>
  );
};

export default WhatsAppNoticePage;
