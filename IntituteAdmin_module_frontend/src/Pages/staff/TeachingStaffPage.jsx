import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StaffCard from '../../components/common/StaffCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Grid, List, Plus, GraduationCap } from 'lucide-react';
import staffService from '../../services/staffService';

const initialsAvatar = (name) => {
  const initials = (name || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%234f46e5'/><text x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='white' text-anchor='middle' dy='.35em'>${initials}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
};

const toCardShape = (s) => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`.trim(),
  photo: initialsAvatar(`${s.firstName} ${s.lastName}`),
  role: s.designation,
  dept: s.department?.name || '—',
  empId: s.employeeCode,
  experience: s.experience || '—',
  phone: s.user?.mobile || '—',
  qualification: s.qualification || '—',
  status: s.status,
});

export const TeachingStaffPage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [teaching, setTeaching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getAll('TEACHING')
      .then((res) => setTeaching(res.data || []))
      .catch((err) => { notifyError(`Failed to load teaching faculty: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = teaching.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.employeeCode.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      header: 'Faculty Name',
      key: 'firstName',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img src={initialsAvatar(`${row.firstName} ${row.lastName}`)} alt="" className="w-8 h-8 rounded-full object-cover border" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{row.firstName} {row.lastName}</p>
            <p className="text-[10px] text-slate-400 font-mono">ID: {row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    { header: 'Designation / Role', key: 'designation', render: (val) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '—' },
    { header: 'Highest Qualification', key: 'qualification', render: (val) => <span className="font-medium text-slate-700 dark:text-slate-300">{val || '—'}</span> },
    { header: 'Experience', key: 'experience', render: (val) => <span className="font-mono">{val || '—'}</span> },
    { header: 'Gross Salary', key: 'salary', sortable: false, render: (val) => val ? <span className="font-mono font-bold">₹{(val.basicPay + val.hra + val.da + val.otherAllowances - val.deductions).toLocaleString()}</span> : '—' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Teaching Faculty Master</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Directory of Professors, Associate Professors, Assistant Professors & Lecturers</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-400'}`}><Grid className="w-4 h-4" /></button>
          </div>

          <button onClick={() => navigate('/admin/staff/registration')} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Add Teaching Staff</span>
          </button>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search teaching faculty..." />

      {error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState title="No Teaching Faculty Yet" description="Register the first teaching staff member." actionLabel="Add Teaching Staff" onAction={() => navigate('/admin/staff/registration')} icon={GraduationCap} />
      ) : viewMode === 'table' ? (
        <DataTable columns={columns} data={filtered} loading={loading} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(toCardShape).map((st) => <StaffCard key={st.id} staff={st} onViewDetails={() => navigate(`/admin/staff/profile?id=${st.id}`)} />)}
        </div>
      )}
    </div>
  );
};

export default TeachingStaffPage;
