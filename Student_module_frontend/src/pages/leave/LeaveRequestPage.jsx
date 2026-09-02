import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ApplyLeaveModal from '../../components/modals/ApplyLeaveModal';
import { useNotification } from '../../context/NotificationContext';
import leaveService from '../../services/leaveService';

const TYPE_LABELS = { MEDICAL: 'Medical Leave', CASUAL: 'Casual / Personal Leave', DUTY: 'On Duty (OD)', EARNED: 'Earned Leave' };
const STATUS_LABELS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };

const daysBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000) + 1;

export const LeaveRequestPage = () => {
  const { error: showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    leaveService.getMyLeaves()
      .then((res) => setLeaves(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load leave requests', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Type', key: 'type', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{TYPE_LABELS[v] || v}</span> },
    { header: 'From Date', key: 'startDate', render: (v) => new Date(v).toLocaleDateString() },
    { header: 'To Date', key: 'endDate', render: (v) => new Date(v).toLocaleDateString() },
    { header: 'Days', key: 'startDate', sortable: false, render: (_v, row) => `${daysBetween(row.startDate, row.endDate)} Day(s)` },
    { header: 'Reason', key: 'reason' },
    { header: 'Approved By', key: 'approvedBy', render: (v) => v || '—' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={STATUS_LABELS[v] || v} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Leave & Absence Requests"
        subtitle="Apply for medical leaves, personal absences, or On Duty (OD) approvals."
        actionLabel="Apply Leave"
        onAction={() => setModalOpen(true)}
      />

      <DataTable columns={columns} data={leaves} loading={loading} />

      <ApplyLeaveModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmitted={load} />
    </div>
  );
};

export default LeaveRequestPage;
