import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2 } from 'lucide-react';
import userService from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';

export const AllUsersPage = () => {
  const { error: showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      if (res?.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load platform users", err);
      showError("Could not retrieve system and tenant users.", "Fetch Error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'User ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]" title={v}>{v && v.length > 8 ? v.substring(0, 8) + '...' : v}</span> },
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
      <PageHeader 
        title="All Platform & Tenant Users" 
        subtitle="Manage Super Admin, Technical, Finance, and Institution Admin accounts across the SaaS ecosystem." 
        badge={`${users.length} Accounts`}
      />
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <DataTable columns={columns} data={users} searchPlaceholder="Search users by name, email, mobile..." />
      )}
    </div>
  );
};

export default AllUsersPage;
