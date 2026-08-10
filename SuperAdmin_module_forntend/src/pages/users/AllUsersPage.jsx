import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockUsers } from '../../data/mockUsersData';
import { Shield, Key, Lock, UserCheck } from 'lucide-react';

export const AllUsersPage = () => {
  const columns = [
    { header: 'User ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Name', key: 'name', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Institution', key: 'institution' },
    { header: 'Platform Role', key: 'role', render: (v) => <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">{v}</span> },
    { header: 'Last Login', key: 'lastLogin' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="All Platform & Tenant Users" subtitle="Manage Super Admin, Technical, Finance, and Institution Admin accounts across the SaaS ecosystem." />
      <DataTable columns={columns} data={mockUsers} />
    </div>
  );
};

export default AllUsersPage;
