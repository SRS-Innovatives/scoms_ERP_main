import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, Calendar } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export const SubjectAttendancePage = () => {
  const { notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegister = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getRegister(date);
      const flattened = (res.data || []).flatMap((session) =>
        session.records.map((r) => ({
          id: r.id,
          rollNo: r.student.rollNumber,
          name: `${r.student.firstName} ${r.student.lastName}`,
          subjectCode: session.subject?.name ? session.subject.name.slice(0, 8).toUpperCase() : '—',
          subjectTitle: session.subject?.name || 'General',
          period: `Period ${session.periodNumber}`,
          status: r.status,
        }))
      );
      setRows(flattened);
    } catch (error) {
      notifyError(`Failed to load subject attendance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [date, notifyError]);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Subject', key: 'subjectTitle', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'Period', key: 'period', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subject-wise Period Attendance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every recorded session, broken out per student and subject</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : rows.length === 0 ? (
        <EmptyState title="No Attendance Recorded" message={`No sessions recorded for ${date}.`} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
};

export default SubjectAttendancePage;
