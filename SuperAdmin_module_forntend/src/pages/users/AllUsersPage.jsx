import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2 } from 'lucide-react';
import userService from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';

// Lets dashboard KPI cards deep-link here pre-filtered, e.g. /super-admin/users?group=student
const GROUP_LABELS = {
  student: { title: 'Enrolled Students', subtitle: 'Every student account across all tenant institutions.' },
  staff: { title: 'Staff Accounts', subtitle: 'Teaching & non-teaching staff, including institute admins, across all tenant institutions.' },
};

export const AllUsersPage = () => {
  const { error: showError } = useNotification();
  const [searchParams] = useSearchParams();
  const group = searchParams.get('group') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers(group ? { group } : {});
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

  const groupInfo = GROUP_LABELS[group];

  const columns = [
    { header: 'User ID', key: 'userCode', render: (v) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] whitespace-nowrap">{v || '—'}</span> },
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
        title={groupInfo?.title || "All Platform & Tenant Users"}
        subtitle={groupInfo?.subtitle || "Manage Super Admin, Technical, Finance, and Institution Admin accounts across the SaaS ecosystem."}
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
