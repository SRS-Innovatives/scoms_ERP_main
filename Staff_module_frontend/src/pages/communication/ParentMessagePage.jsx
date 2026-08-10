import React from 'react';
import { MessageSquare, PhoneCall } from 'lucide-react';

export const ParentMessagePage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-500" /> Parent Direct Messaging Inbox
      </h3>
      <div className="space-y-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Mr. Suresh Verma (Father of Rohan Verma)</span>
            <p className="text-slate-500 mt-0.5">"Sir, Rohan was sick on Monday. Kindly approve leave note attached."</p>
          </div>
          <button className="px-3 py-1.5 font-bold text-white bg-sky-600 rounded-lg">Reply</button>
        </div>
      </div>
    </div>
  );
};

export default ParentMessagePage;
