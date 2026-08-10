import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Send, CheckCircle2 } from 'lucide-react';

export const PublishMarksPage = () => {
  const { success } = useNotification();

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Publish Class Marks to Student & Parent Portal</h3>
      <p className="text-xs text-slate-500 mb-4">Once published, marks cards will be accessible via SCOMS Student Mobile App & Portal.</p>
      <button
        onClick={() => success('Class 12-A Mid-Term Physics marks published live!', 'Marks Published')}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
      >
        <Send className="w-4 h-4" /> Publish Marks Live
      </button>
    </div>
  );
};

export default PublishMarksPage;
