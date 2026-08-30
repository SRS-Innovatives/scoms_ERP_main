import React, { useEffect, useState } from 'react';
import { Loader2, LayoutGrid, Users, BookOpen } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import attendanceService from '../../services/attendanceService';

export const WorkloadReportPage = () => {
  const { error: showError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getMyClasses()
      .then((res) => setMappings(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load workload report', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  const totalStudents = mappings.reduce((sum, m) => sum + (m.section?._count?.students || 0), 0);
  const uniqueSubjects = new Set(mappings.map((m) => m.subjectId)).size;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Teaching Workload Report</h2>

      {mappings.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <LayoutGrid className="w-8 h-8 text-slate-300" /> No classes assigned yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <LayoutGrid className="w-8 h-8 text-sky-500" />
              <div><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{mappings.length}</p><p className="text-xs text-slate-500">Class Assignments</p></div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-500" />
              <div><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{uniqueSubjects}</p><p className="text-xs text-slate-500">Distinct Subjects</p></div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-500" />
              <div><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalStudents}</p><p className="text-xs text-slate-500">Total Students Taught</p></div>
            </div>
          </div>

          <div className="overflow-x-auto glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Section</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-semibold">{m.section?.name}</td>
                    <td className="p-3">{m.section?.semester?.course?.name}</td>
                    <td className="p-3">{m.subject?.name}</td>
                    <td className="p-3 font-bold text-emerald-600">{m.section?._count?.students ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkloadReportPage;
