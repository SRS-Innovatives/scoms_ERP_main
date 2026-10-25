import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import ChartCard from '../../components/common/ChartCard';
import { useNotification } from '../../context/NotificationContext';
import { Printer, Loader2 } from 'lucide-react';
import studentService from '../../services/studentService';
import ErrorState from '../../components/common/ErrorState';

export const AdmissionReportPage = () => {
  const { notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    studentService.getAll({ limit: 1000 })
      .then((res) => setStudents(res.data || []))
      .catch((err) => { notifyError(`Failed to load admission report: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const { genderBreakdown, courseBreakdown } = useMemo(() => {
    const byGender = {};
    const byCourse = {};
    students.forEach((s) => {
      byGender[s.gender] = (byGender[s.gender] || 0) + 1;
      const courseName = s.course?.name || 'Unassigned';
      byCourse[courseName] = (byCourse[courseName] || 0) + 1;
    });
    return {
      genderBreakdown: Object.entries(byGender).map(([name, count]) => ({ name, count })),
      courseBreakdown: Object.entries(byCourse).map(([label, amount]) => ({ label, amount })),
    };
  }, [students]);

  const columns = [
    { header: 'Reg No', key: 'registerNumber', render: (val, row) => <span className="font-mono font-bold text-indigo-600">{val || row.admissionNumber}</span> },
    { header: 'Student Name', key: 'firstName', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</span> },
    { header: 'Gender', key: 'gender' },
    { header: 'Course', key: 'course', sortable: false, render: (val) => val?.name || '—' },
    { header: 'Department', key: 'department', sortable: false, render: (val) => val?.name || '—' },
    { header: 'Admission Date', key: 'admissionDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status' },
  ];

  const filtered = students.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admission & Intake Analytics Report</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Demographic breakdown of all admitted students</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold no-print">
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title="Admissions by Course" type="bar" data={courseBreakdown} height={200} />
            </div>
            <ChartCard title="Gender Distribution" type="pie" data={genderBreakdown} height={200} />
          </div>

          <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search student name or admission no..." />
          <DataTable columns={columns} data={filtered} />
        </>
      )}
    </div>
  );
};

export default AdmissionReportPage;
