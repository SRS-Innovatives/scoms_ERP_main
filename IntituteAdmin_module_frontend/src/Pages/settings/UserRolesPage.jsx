import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ShieldCheck, Lock } from 'lucide-react';

export const UserRolesPage = () => {
  const roles = [
    { roleName: 'Institute Admin / Principal', code: 'ROLE_ADMIN', usersCount: 2, permissions: 'Full Access (All Modules)', status: 'Active' },
    { roleName: 'HOD / Department Chair', code: 'ROLE_HOD', usersCount: 18, permissions: 'Dept Students, Staff, Marks & Attendance', status: 'Active' },
    { roleName: 'Class Advisor / Faculty', code: 'ROLE_TEACHER', usersCount: 145, permissions: 'Class Roll Call, Internal Marks Entry', status: 'Active' },
    { roleName: 'Senior Accountant', code: 'ROLE_ACCOUNTS', usersCount: 4, permissions: 'Fee POS, Receipts, Cash Book & Challans', status: 'Active' },
    { roleName: 'Librarian', code: 'ROLE_LIBRARY', usersCount: 3, permissions: 'Book Catalog, Issue/Return & Fines', status: 'Active' }
  ];

  const columns = [
    { header: 'Role Title', key: 'roleName', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Role Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Active Users', key: 'usersCount', render: (val) => `${val} Users` },
    { header: 'Assigned Access Scope', key: 'permissions', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure administrative roles, departmental boundaries & user privilege scopes</p>
      </div>

      <DataTable columns={columns} data={roles} />
    </div>
  );
};

export default UserRolesPage;
