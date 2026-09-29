import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import examService from '../../services/examService';
import { Calendar, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

export const ExamSchedulePage = () => {
  const { error: showError } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    examService.getExamSchedule()
      .then((res) => setSchedules(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load exam schedule', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Subject Code', key: 'subject', sortable: false, render: (v) => <span className="font-mono font-bold text-indigo-600">{v?.code}</span> },
    { header: 'Subject Title', key: 'subject2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.subject?.name}</span> },
    { header: 'Exam', key: 'exam', sortable: false, render: (v) => v?.name },
    { header: 'Date', key: 'examDate', render: (v) => <span className="font-bold text-rose-600">{new Date(v).toLocaleDateString('en-IN')}</span> },
    { header: 'Timings', key: 'startTime', sortable: false, render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { header: 'Room', key: 'roomNumber', render: (v) => v || '—' },
    { header: 'Status', key: 'exam2', sortable: false, render: (_, row) => <StatusBadge status={row.exam?.status} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semester Examination Timetable"
        subtitle="Subject-wise exam date, time, and room allocation"
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : schedules.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No exams scheduled yet.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={schedules} />
      )}
    </div>
  );
};

export default ExamSchedulePage;
