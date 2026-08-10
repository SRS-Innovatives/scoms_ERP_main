import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Check, X, Save } from 'lucide-react';

export const PermissionMatrixPage = () => {
  const { success } = useNotification();

  const categories = [
    "Dashboard Overview",
    "Institution Management",
    "User Management & Roles",
    "Subscriptions & Plans",
    "Billing & GST Invoices",
    "Communication (SMS/WhatsApp)",
    "Support Ticket Desk",
    "AI & Analytics",
    "Security & Audit Logs",
    "System & API Keys"
  ];

  const actions = ["View", "Create", "Edit", "Delete", "Export", "Approve", "Manage"];

  const [permissions, setPermissions] = useState(() => {
    const map = {};
    categories.forEach(cat => {
      actions.forEach(act => {
        map[`${cat}-${act}`] = true;
      });
    });
    return map;
  });

  const togglePerm = (cat, act) => {
    const key = `${cat}-${act}`;
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Permission Matrix"
        subtitle="Granular View, Create, Edit, Delete, Export, Approve, and Manage matrix across platform modules."
        actionLabel="Save Permission Matrix"
        onAction={() => success('Super Admin permission matrix successfully updated!', 'RBAC Saved')}
        actionIcon={Save}
      />

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-4">Module Category</th>
                {actions.map(act => (
                  <th key={act} className="p-4 text-center">{act}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {categories.map(cat => (
                <tr key={cat} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{cat}</td>
                  {actions.map(act => {
                    const isChecked = permissions[`${cat}-${act}`];
                    return (
                      <td key={act} className="p-4 text-center">
                        <button
                          onClick={() => togglePerm(cat, act)}
                          className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-40" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrixPage;
