import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { FlaskConical, Check } from 'lucide-react';

export const EquipmentIssuePage = () => {
  const { success } = useNotification();
  const [studentName, setStudentName] = useState('Aarav Patel');
  const [equipment, setEquipment] = useState('Digital Storage Oscilloscope (DSO)');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Equipment "${equipment}" issued to ${studentName} for Physics Practical Session!`, 'Equipment Issued');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-purple-500" /> Issue Lab Equipment / Apparatus
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Name / Roll No</label>
          <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Equipment</label>
          <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Check className="w-4 h-4" /> Issue Apparatus
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentIssuePage;
