import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import StudentCard from '../../components/common/StudentCard';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Grid, List, Plus, CreditCard, Users, Loader2 } from 'lucide-react';
import studentService from '../../services/studentService';

export const StudentListPage = () => {
  const { notifyError } = useNotification();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    studentService.getAll({ search })
      .then((res) => setStudents(res.data || []))
      .catch((err) => notifyError(`Failed to load students: ${err.message}`))
      .finally(() => setLoading(false));
  }, [search, notifyError]);

  useEffect(() => {
    const timer = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timer);
  }, [load]);

  // Map real fields to the shape StudentCard/DataTable expect.
  const mapped = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    photo: s.user?.avatar,
    rollNo: s.rollNumber || '—',
    regNo: s.registerNumber || s.admissionNumber,
    course: `${s.course?.name || '—'} / ${s.department?.name || '—'}`,
    yearSem: `${s.section?.semester?.name || '—'} - ${s.section?.name || '—'}`,
    scholarship: s.scholarship,
    feeStatus: s.feeStatus,
  }));

  const columns = [
    {
      header: 'Student Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.photo ? (
            <img src={row.photo} alt={val} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {val.charAt(0)}
            </div>
          )}
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
    { header: 'Scholarship', key: 'scholarship', render: (val) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{val}</span> },
    { header: 'Fee Status', key: 'feeStatus', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/student/profile?id=${id}`)}
            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
          >
            Profile
          </button>
          <button
            onClick={() => navigate(`/admin/student/id-card?id=${id}`)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="ID Card"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

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
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : mapped.length === 0 ? (
        <EmptyState title="No Students Found" description="No students match your search, or none have been admitted yet." icon={Users} />
      ) : viewMode === 'table' ? (
        <DataTable columns={columns} data={mapped} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapped.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onViewDetails={() => navigate(`/admin/student/profile?id=${s.id}`)}
              onPrintCard={() => navigate(`/admin/student/id-card?id=${s.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
