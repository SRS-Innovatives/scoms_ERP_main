import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import StudentCard from '../../components/common/StudentCard';
import { studentsList as initialStudents } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Grid, List, Plus, CreditCard, FileText } from 'lucide-react';

export const StudentListPage = () => {
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [students] = useState(initialStudents);

  const columns = [
    {
      header: 'Student Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={val} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{val}</p>
            <p className="text-[10px] text-slate-400 font-mono">Reg: {row.regNo}</p>
          </div>
        </div>
      )
    },
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Course & Dept', key: 'course' },
    { header: 'Year / Sem', key: 'yearSem' },
    { header: 'Aadhaar No', key: 'aadhaarNo', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { header: 'Scholarship', key: 'scholarship', render: (val) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{val}</span> },
    { header: 'Fee Status', key: 'feeStatus', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/student/profile')}
            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
          >
            Profile
          </button>
          <button
            onClick={() => navigate('/admin/student/id-card')}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="ID Card"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.regNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Master Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive list of all registered students, courses, fee & scholarship status</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600' : 'text-slate-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/student/admission')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search student by name, roll no, reg no..."
        filters={[
          {
            key: 'fee',
            label: 'Fee Status',
            options: [
              { label: 'Paid', value: 'Paid' },
              { label: 'Pending', value: 'Pending' }
            ]
          }
        ]}
      />

      {viewMode === 'table' ? (
        <DataTable columns={columns} data={filtered} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onViewDetails={() => navigate('/admin/student/profile')}
              onPrintCard={() => navigate('/admin/student/id-card')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
