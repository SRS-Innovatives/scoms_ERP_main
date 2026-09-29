import React, { useEffect, useState, useCallback } from 'react';
import PerformanceChart from '../../components/common/PerformanceChart';
import { Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';
import ErrorState from '../../components/common/ErrorState';

export const AssignmentAnalyticsPage = () => {
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    assignmentService.getAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load analytics', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  const shortLabel = (title) => (title.length > 14 ? `${title.slice(0, 14)}…` : title);

  // No class-roster-size endpoint exists yet, so "submission rate" shows whether an
  // assignment has received any submissions at all (100%) or none yet (0%).
  const submissionData = assignments.map((a) => ({
    label: shortLabel(a.title),
    value: a._count?.submissions ? 100 : 0,
    target: 100,
  }));

  const marksData = assignments.map((a) => ({
    label: shortLabel(a.title),
    value: a.totalMarks,
    target: 100,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assignment Submission & Grading Analytics</h2>
      {assignments.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No assignments created yet — analytics will appear once you publish assignments and receive submissions.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart title="Submissions Received per Assignment" height={220} data={submissionData} />
          <PerformanceChart title="Assignments Overview (Total Marks)" height={220} data={marksData} />
        </div>
      )}
    </div>
  );
};

export default AssignmentAnalyticsPage;
