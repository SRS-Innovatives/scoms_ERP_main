import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Award, Save } from 'lucide-react';

export const CertificateEntryPage = () => {
  const { success } = useNotification();
  const [studentName, setStudentName] = useState('Ananya Sen');
  const [eventTitle, setEventTitle] = useState('State Physics Olympiad 2026');
  const [position, setPosition] = useState('1st Rank (Gold Medal)');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`E-Certificate generated for ${studentName} (${position})!`, 'Certificate Issued');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-500" /> Event Certificate Generator & Entry
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
          <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Event / Competition</label>
          <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Position / Merit Secured</label>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
            <Save className="w-4 h-4" /> Issue Certificate
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificateEntryPage;
