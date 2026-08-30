import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import settingsService from '../../services/settingsService';

const ROLE_LABELS = {
  INSTITUTE_ADMIN: 'Institute Admin / Principal Office',
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  HOD: 'HOD / Department Chair',
  TEACHER: 'Class Advisor / Faculty',
  STAFF: 'General Staff',
  ACCOUNTANT: 'Accountant',
  LIBRARIAN: 'Librarian',
  TRANSPORT_MANAGER: 'Transport Manager',
  HOSTEL_WARDEN: 'Hostel Warden',
  EXAM_ADMIN: 'Exam Administrator',
  PLACEMENT_OFFICER: 'Placement Officer',
};

export const UserRolesPage = () => {
  const { notifyError } = useNotification();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getUserRoles()
      .then((res) => setRoles(res.data || []))
      .catch((err) => notifyError(`Failed to load roles: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const columns = [
    { header: 'Role Title', key: 'role', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" />{ROLE_LABELS[val] || val}</span> },
    { header: 'Role Code', key: 'role2', sortable: false, render: (_, row) => <span className="font-mono font-bold text-indigo-600">{row.role}</span> },
    { header: 'Active Users', key: 'usersCount', render: (val) => `${val} User${val === 1 ? '' : 's'}` },
    { header: 'Granted Permissions', key: 'permissionCount', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val} permissions</span> },
    { header: 'Status', key: 'usersCount2', sortable: false, render: (_, row) => <StatusBadge status={row.usersCount > 0 ? 'Active' : 'Inactive'} text={row.usersCount > 0 ? 'IN USE' : 'UNUSED'} /> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Real user counts and granted permission counts per role — see Detailed Permission Matrix for the full breakdown</p>
      </div>

      <DataTable columns={columns} data={roles} />
    </div>
  );
};

export default UserRolesPage;
