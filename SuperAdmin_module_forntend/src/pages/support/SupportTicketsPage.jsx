import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockSupportTickets } from '../../data/mockSupportData';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SupportTicketsPage = () => {
  const navigate = useNavigate();

  const columns = [
    { header: 'Ticket ID', key: 'id', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Institution', key: 'institution', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Priority', key: 'priority', render: (v) => <span className="font-bold text-rose-600">{v}</span> },
    { header: 'Subject', key: 'subject' },
    { header: 'Assigned Agent', key: 'assignedAgent' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => navigate(`/super-admin/tickets/${id}`)} className="p-1.5 text-indigo-600 font-bold text-xs flex items-center gap-1">
          <MessageCircle className="w-4 h-4" /> Open Thread
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Support Desk & Ticket Queue" subtitle="Manage technical, billing, and feature inquiries from registered institutions." />
      <DataTable columns={columns} data={mockSupportTickets} />
    </div>
  );
};

export default SupportTicketsPage;
