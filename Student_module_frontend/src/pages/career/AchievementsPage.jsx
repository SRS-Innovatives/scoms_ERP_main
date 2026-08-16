import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Award, Trophy } from 'lucide-react';

export const AchievementsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Student Achievements Portfolio" subtitle="Extracurricular awards, hackathon certificates, and sports medals." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 max-w-md text-xs">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">First Prize - IIT Madras Hackathon 2026</h3>
            <p className="text-slate-500">Awarded ₹25,000 cash prize for SCOMS ERP prototype</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
