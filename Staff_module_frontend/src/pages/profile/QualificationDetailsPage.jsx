import React from 'react';
import { mockStaffProfile } from '../../data/mockStaffData';
import { Award, Plus } from 'lucide-react';

export const QualificationDetailsPage = () => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-sky-500" /> Academic Qualifications & Degrees
        </h3>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700">
          <Plus className="w-4 h-4" /> Add Qualification
        </button>
      </div>

      <div className="space-y-3">
        {mockStaffProfile.qualification.map((q, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{q.degree}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.institute}</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-sky-600 dark:text-sky-400 block">{q.percentage}</span>
              <span className="text-slate-400">Year: {q.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualificationDetailsPage;
