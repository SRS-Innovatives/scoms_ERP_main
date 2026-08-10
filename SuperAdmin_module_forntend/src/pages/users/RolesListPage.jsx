import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import CreateRoleModal from '../../components/modals/CreateRoleModal';
import { ShieldCheck, Check, Edit } from 'lucide-react';

export const RolesListPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const roles = [
    { title: 'Super Admin', usersCount: 2, desc: 'Unrestricted master control over institutions, billing, security, and platform settings.' },
    { title: 'Platform Admin', usersCount: 4, desc: 'Can manage institutions, onboard tenants, view billing, and manage support tickets.' },
    { title: 'Support Admin', usersCount: 6, desc: 'Dedicated to resolving support tickets, live chats, and knowledge base documentation.' },
    { title: 'Finance Admin', usersCount: 3, desc: 'Access restricted to invoices, payments, tax settings (GST), and financial reports.' },
    { title: 'Technical Admin', usersCount: 5, desc: 'Access to system health, API keys, feature flags, backups, and audit logs.' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC)"
        subtitle="Configure platform administrative roles and permission boundaries."
        actionLabel="Create Custom Role"
        onAction={() => setModalOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                {role.usersCount} Users Assigned
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{role.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
          </div>
        ))}
      </div>

      <CreateRoleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RolesListPage;
