import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import { Briefcase, Plus } from 'lucide-react';

export const ExperienceDetailsPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" /> Teaching & Professional Experience
        </h3>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700">
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      <div className="space-y-3">
        {mockStaffProfile.experience.map((exp, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{exp.role}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exp.organization}</p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
              {exp.period}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceDetailsPage;
