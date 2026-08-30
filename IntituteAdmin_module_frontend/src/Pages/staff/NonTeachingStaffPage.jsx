import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase } from 'lucide-react';
import staffService from '../../services/staffService';

export const NonTeachingStaffPage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [nonTeaching, setNonTeaching] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    staffService.getAll('NON_TEACHING')
      .then((res) => setNonTeaching(res.data || []))
      .catch((err) => notifyError(`Failed to load non-teaching staff: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = nonTeaching.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.employeeCode.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { header: 'Staff Name', key: 'firstName', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</span> },
    { header: 'Emp ID', key: 'employeeCode', render: (val) => <span className="font-mono text-indigo-600">{val}</span> },
    { header: 'Role / Designation', key: 'designation', render: (val) => <span className="font-bold text-indigo-600">{val}</span> },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '—' },
    { header: 'Qualification', key: 'qualification', render: (val) => val || '—' },
    { header: 'Monthly Salary', key: 'salary', sortable: false, render: (val) => val ? <span className="font-mono font-bold">₹{(val.basicPay + val.hra + val.da + val.otherAllowances - val.deductions).toLocaleString()}</span> : '—' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Non-Teaching & Admin Staff Master</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Directory of Accountants, Librarians, Lab Technicians & Administrative Officers</p>
        </div>

        <button onClick={() => navigate('/admin/staff/registration')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Non-Teaching Staff</span>
        </button>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search non-teaching staff..." />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Non-Teaching Staff Yet" description="Register the first non-teaching staff member." actionLabel="Add Non-Teaching Staff" onAction={() => navigate('/admin/staff/registration')} icon={Briefcase} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default NonTeachingStaffPage;
