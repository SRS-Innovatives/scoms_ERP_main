import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StaffCard from '../../components/common/StaffCard';
import StatusBadge from '../../components/common/StatusBadge';
import { staffList } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { Grid, List, Plus } from 'lucide-react';

export const TeachingStaffPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const teaching = staffList.filter((s) => s.type === 'Teaching');

  const columns = [
    {
      header: 'Faculty Name',
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
    { header: 'Designation / Role', key: 'role', render: (val) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Highest Qualification', key: 'qualification', render: (val) => <span className="font-medium text-slate-700 dark:text-slate-300">{val}</span> },
    { header: 'Experience', key: 'experience', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Gross Salary', key: 'salary', render: (val) => <span className="font-mono font-bold">₹{val.toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
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
      {viewMode === 'table' ? <DataTable columns={columns} data={teaching} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teaching.map((st) => <StaffCard key={st.id} staff={st} onViewDetails={() => navigate('/admin/staff/profile')} />)}
        </div>
      )}
    </div>
  );
};

export default TeachingStaffPage;
