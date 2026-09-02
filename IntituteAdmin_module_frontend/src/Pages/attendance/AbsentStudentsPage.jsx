import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Loader2, Calendar } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

export const AbsentStudentsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchAbsentees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAbsentees(date);
      setAbsentees(res.data || []);
    } catch (error) {
      notifyError(`Failed to load absentees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [date, notifyError]);

  useEffect(() => {
    fetchAbsentees();
  }, [fetchAbsentees]);

  const handleSendSms = async () => {
    const studentIds = [...new Set(absentees.map((a) => a.studentId))];
    if (studentIds.length === 0) return;
    setSending(true);
    try {
      const res = await attendanceService.notifyAbsentees(studentIds);
      notifySuccess(`Absence SMS sent to ${res.data.sentCount} of ${res.data.total} parents.`);
    } catch (error) {
      notifyError(`Failed to send SMS: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { header: 'Roll No', key: 'rollNumber', render: (val) => <span className="font-mono font-bold text-rose-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Section', key: 'section' },
    { header: 'Subject', key: 'subject' },
    { header: 'Parent Phone (SMS Target)', key: 'parentPhone', render: (val) => <span className="font-mono font-bold text-indigo-600">{val || 'No contact on file'}</span> },
    { header: 'Status', key: 'studentId', sortable: false, render: () => <StatusBadge status="Absent" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Absent Student List & Parent SMS Dispatch</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Parents are already notified automatically when staff mark attendance — use this to resend.</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200" />
          <button
            onClick={handleSendSms}
            disabled={sending || absentees.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{sending ? 'Sending...' : `Resend SMS (${absentees.length})`}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : absentees.length === 0 ? (
        <EmptyState title="No Absentees" message={`No students were marked absent on ${date}.`} />
      ) : (
        <DataTable columns={columns} data={absentees} keyField="recordId" />
      )}
    </div>
  );
};

export default AbsentStudentsPage;
