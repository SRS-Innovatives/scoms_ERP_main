import React, { useEffect, useState } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';
import ErrorState from '../../components/common/ErrorState';

export const AssignmentReportPage = () => {
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    assignmentService.getAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load assignment report', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assignment Submission Report</h2>

      {assignments.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 text-slate-300" /> No assignments created yet.
        </div>
      ) : (
        <div className="overflow-x-auto glass-card rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Class</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Submissions</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold">{a.title}</td>
                  <td className="p-3">{a.className}</td>
                  <td className="p-3">{a.subjectName}</td>
                  <td className="p-3">{new Date(a.dueDate).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-sky-600">{a._count?.submissions ?? 0}</td>
                  <td className="p-3">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignmentReportPage;
