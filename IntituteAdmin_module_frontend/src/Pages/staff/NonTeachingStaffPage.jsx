import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { staffList } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const NonTeachingStaffPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const nonTeaching = staffList.filter((s) => s.type === 'Non-Teaching');

  const columns = [
    {
      header: 'Staff Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={val} className="w-8 h-8 rounded-full object-cover border" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{val}</p>
            <p className="text-[10px] text-slate-400 font-mono">ID: {row.empId}</p>
          </div>
        </div>
      )
    },
    { header: 'Role / Designation', key: 'role', render: (val) => <span className="font-bold text-indigo-600">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Qualification', key: 'qualification' },
    { header: 'Monthly Salary', key: 'salary', render: (val) => <span className="font-mono font-bold">₹{val.toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
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
      <DataTable columns={columns} data={nonTeaching} />
    </div>
  );
};

export default NonTeachingStaffPage;
