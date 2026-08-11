import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Calendar, CheckCircle } from 'lucide-react';

export const AiStudyPlanPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Generated Exam Revision Plan" subtitle="Tailored 7-day revision timeline targeting weak chapters based on quiz performance." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">7-Day Study Revision Schedule</h3>
        <div className="space-y-2">
          {["Day 1: OS Process Synchronization & Deadlocks", "Day 2: DBMS 3NF & BCNF Normalization Problems", "Day 3: Data Structures Tree Traversal & Graph Algorithms", "Day 4: Web Tech React Hooks & Component State", "Day 5: Full Mock Practice Test & Formula Revision"].map((d, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between font-semibold">
              <span>{d}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiStudyPlanPage;
