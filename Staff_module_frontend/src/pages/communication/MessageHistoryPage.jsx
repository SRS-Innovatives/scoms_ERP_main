import React from 'react';
import { Clock } from 'lucide-react';

export const MessageHistoryPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-sky-500" /> Sent Broadcast & Notification History
      </h3>
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between">
          <span>SMS to Absentees (Class 12-A) - 2 Sent</span>
          <span className="text-slate-400">11-Aug-2026 10:30 AM</span>
        </div>
      </div>
    </div>
  );
};

export default MessageHistoryPage;
