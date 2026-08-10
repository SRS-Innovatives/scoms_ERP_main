import React from 'react';
import { Send } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const SmsCenterPage = () => {
  const { success } = useNotification();
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">SMS Gateway Broadcast Center</h3>
      <p className="text-xs text-slate-500 mb-4">Send SMS alerts directly to registered parent mobile numbers.</p>
      <button
        onClick={() => success('SMS Broadcast dispatched via TRAI approved gateway.', 'SMS Sent')}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
      >
        <Send className="w-4 h-4" /> Trigger Bulk SMS Broadcast
      </button>
    </div>
  );
};

export default SmsCenterPage;
