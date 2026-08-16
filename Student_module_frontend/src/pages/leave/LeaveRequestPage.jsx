import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ApplyLeaveModal from '../../components/modals/ApplyLeaveModal';
import { Plus } from 'lucide-react';

export const LeaveRequestPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const leaveHistory = [
    { id: "LEV-101", type: "Medical Leave", fromDate: "2026-07-10", toDate: "2026-07-12", days: 3, reason: "Viral Fever & Doctor Prescription", status: "Approved", approver: "Dr. Malathi S. (Class Teacher)" },
    { id: "LEV-102", type: "On Duty (OD)", fromDate: "2026-06-18", toDate: "2026-06-18", days: 1, reason: "Inter-College Hackathon at IIT Madras", status: "Approved", approver: "Prof. Arvind Rao" }
  ];

  const columns = [
    { header: 'ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Type', key: 'type', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'From Date', key: 'fromDate' },
    { header: 'To Date', key: 'toDate' },
    { header: 'Days', key: 'days', render: (v) => `${v} Day(s)` },
    { header: 'Reason', key: 'reason' },
    { header: 'Approver Notes', key: 'approver' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Leave & Absence Requests"
        subtitle="Apply for medical leaves, personal absences, or On Duty (OD) approvals."
        actionLabel="Apply Leave"
        onAction={() => setModalOpen(true)}
      />

      <DataTable columns={columns} data={leaveHistory} />

      <ApplyLeaveModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default LeaveRequestPage;
