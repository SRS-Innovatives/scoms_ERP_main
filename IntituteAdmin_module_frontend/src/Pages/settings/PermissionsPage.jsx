import React from 'react';
import FormSection from '../../components/common/FormSection';
import { ShieldCheck, Check } from 'lucide-react';

export const PermissionsPage = () => {
  const modules = ['Student Management', 'Fee Collection', 'Attendance', 'Examination', 'Library', 'Transport', 'Hostel'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Permission Matrix</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Granular Read / Write / Delete / Export permission matrix per role</p>
      </div>

      <FormSection title="Module Access Permissions Grid" icon={ShieldCheck}>
        <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px]">
              <th className="p-3 border-r">Module Name</th>
              <th className="p-3 border-r text-center">Admin</th>
              <th className="p-3 border-r text-center">HOD</th>
              <th className="p-3 border-r text-center">Faculty</th>
              <th className="p-3 text-center">Accountant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            {modules.map((m, idx) => (
              <tr key={idx}>
                <td className="p-3 font-bold border-r text-slate-900 dark:text-white">{m}</td>
                <td className="p-3 border-r text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="p-3 border-r text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="p-3 border-r text-center">{idx % 2 === 0 ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                <td className="p-3 text-center">{m === 'Fee Collection' ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FormSection>
    </div>
  );
};

export default PermissionsPage;
