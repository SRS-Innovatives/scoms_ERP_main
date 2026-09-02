import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';

export const SubjectMappingPage = () => {
  const { error: showError } = useNotification();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getMyClasses()
      .then((res) => setMappings(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load subject allocations', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-500" /> Subject & Class Allocation Mapping
      </h3>

      {mappings.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No subject/class allocations yet. Ask your Institute Admin to assign you to a subject and section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Class Name</th>
                <th className="p-3">Subject Name</th>
                <th className="p-3">Subject Code</th>
                <th className="p-3">Students Enrolled</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                    {m.section?.semester?.course?.name} — {m.section?.name}
                  </td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">{m.subject?.name}</td>
                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{m.subject?.code || '—'}</td>
                  <td className="p-3 font-semibold">{m.section?._count?.students ?? 0} Students</td>
                  <td className="p-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Allocated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubjectMappingPage;
