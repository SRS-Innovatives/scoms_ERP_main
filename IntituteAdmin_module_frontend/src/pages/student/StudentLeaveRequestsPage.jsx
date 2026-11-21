import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { CalendarX, Check, X, Paperclip } from 'lucide-react';
import studentLeaveService from '../../services/studentLeaveService';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN');

/**
 * Every student leave request in the institution. Students apply from their portal; the
 * class teacher normally decides (Staff portal → Student Leave Approvals). The Institute
 * Admin sees all of them here and can approve or reject too.
 */
export const StudentLeaveRequestsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    studentLeaveService.getAll(status)
      .then((res) => setLeaves(res.data || []))
      .catch((err) => { notifyError(`Failed to load student leave requests: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [status, notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDecision = async (id, decision) => {
    setBusyId(id);
    try {
      await studentLeaveService.updateStatus(id, decision);
      notifySuccess(`Leave request ${decision.toLowerCase()} — the student has been notified.`);
      fetchAll();
    } catch (err) {
      notifyError(`Failed to update leave: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = leaves.filter((l) => {
    if (!q) return true;
    const s = l.student || {};
    return [s.firstName, s.lastName, s.rollNumber, s.admissionNumber, l.className, l.reason]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const columns = [
    {
      header: 'Student', key: 'student', sortable: false,
      render: (s) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{s?.firstName} {s?.lastName}</p>
          <p className="text-[11px] text-slate-500 font-mono">{s?.admissionNumber}{s?.rollNumber ? ` · Roll ${s.rollNumber}` : ''}</p>
        </div>
      ),
    },
    { header: 'Class', key: 'className', render: (v) => v || '—' },
    {
      header: 'Class Teacher', key: 'classTeacherName', sortable: false,
      render: (v) => v || <span className="text-amber-600 font-semibold">Not assigned</span>,
    },
    { header: 'Type', key: 'type', render: (v) => <span className="text-xs font-semibold">{v}</span> },
    {
      header: 'Dates', key: 'startDate', sortable: false,
      render: (_, row) => <span className="font-mono">{fmtDate(row.startDate)}{row.endDate && fmtDate(row.endDate) !== fmtDate(row.startDate) ? ` – ${fmtDate(row.endDate)}` : ''}</span>,
    },
    {
      header: 'Reason', key: 'reason', sortable: false,
      render: (v, row) => (
        <span className="inline-flex items-center gap-1">
          {row.hasAttachment && <Paperclip className="w-3 h-3 text-slate-400" title="Has attachment" />}
          {v}
        </span>
      ),
    },
    {
      header: 'Status', key: 'status',
      render: (v, row) => (
        <div>
          <StatusBadge status={v} />
          {row.approvedBy && v !== 'PENDING' && <p className="text-[10px] text-slate-400 mt-0.5">by {row.approvedBy}</p>}
        </div>
      ),
    },
    {
      header: 'Action', key: 'id', sortable: false,
      render: (id, row) => row.status === 'PENDING' && (
        <div className="flex gap-1.5">
          <button title="Approve" disabled={busyId === id} onClick={() => handleDecision(id, 'APPROVED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg disabled:opacity-50"><Check className="w-3.5 h-3.5" /></button>
          <button title="Reject" disabled={busyId === id} onClick={() => handleDecision(id, 'REJECTED')} className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-50"><X className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Leave Requests</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Leave applied by students from their portal. The class teacher usually approves these in the Staff portal — you can see every request here and approve or reject as well.
        </p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student, roll no, admission no, class or reason..."
        filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS }]}
        onFilterChange={(key, value) => { if (key === 'status') setStatus(value); }}
        onRefreshClick={fetchAll}
      />

      {error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState
          title={status === 'PENDING' ? 'No Pending Leave Requests' : 'No Leave Requests'}
          description={status === 'PENDING' ? 'Every student leave request has been decided.' : 'Nothing matches this filter.'}
          icon={CalendarX}
        />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}
    </div>
  );
};

export default StudentLeaveRequestsPage;
