import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck, Check, Loader2 } from 'lucide-react';
import settingsService from '../../services/settingsService';

const ROLE_LABELS = {
  INSTITUTE_ADMIN: 'Institute Admin',
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  HOD: 'HOD',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
  ACCOUNTANT: 'Accountant',
  LIBRARIAN: 'Librarian',
  TRANSPORT_MANAGER: 'Transport Mgr',
  HOSTEL_WARDEN: 'Hostel Warden',
  EXAM_ADMIN: 'Exam Admin',
  PLACEMENT_OFFICER: 'Placement Officer',
};

export const PermissionsPage = () => {
  const { notifyError } = useNotification();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getPermissionMatrix()
      .then((res) => setMatrix(res.data || []))
      .catch((err) => notifyError(`Failed to load permission matrix: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const modules = [...new Set(matrix.flatMap((r) => r.permissions.map((p) => p.split('.')[0])))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Permission Matrix</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">The actual role → permission grants enforced by the server on every request</p>
      </div>

      <FormSection title="Module Access Permissions Grid" icon={ShieldCheck}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase text-[10px]">
                <th className="p-3 border-r sticky left-0 bg-slate-100 dark:bg-slate-800">Module</th>
                {matrix.map((r) => <th key={r.role} className="p-3 border-r text-center whitespace-nowrap">{ROLE_LABELS[r.role] || r.role}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {modules.map((mod) => (
                <tr key={mod}>
                  <td className="p-3 font-bold border-r text-slate-900 dark:text-white capitalize sticky left-0 bg-white dark:bg-slate-900">{mod.replace(/_/g, ' ')}</td>
                  {matrix.map((r) => {
                    const has = r.permissions.some((p) => p.startsWith(`${mod}.`));
                    return (
                      <td key={r.role} className="p-3 border-r text-center">
                        {has ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </div>
  );
};

export default PermissionsPage;
