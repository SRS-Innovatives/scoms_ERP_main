import React, { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supportService from '../../services/supportService';

export const SupportTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportService.getTickets()
      .then((res) => setTickets(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Ticket #', key: 'ticketNumber', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v?.name || 'Unassigned'}</span> },
    { header: 'Category', key: 'category', render: (v) => v || '—' },
    { header: 'Priority', key: 'priority', render: (v) => <span className="font-bold text-rose-600">{v}</span> },
    { header: 'Subject', key: 'subject' },
    { header: 'Assigned Agent', key: 'assignedTo', render: (v) => v || 'Unassigned' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => navigate(`/super-admin/tickets/${id}`)} className="p-1.5 text-indigo-600 font-bold text-xs flex items-center gap-1">
          <MessageCircle className="w-4 h-4" /> Open
        </button>
      )
    }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support Desk & Ticket Queue" subtitle="Manage technical, billing, and feature inquiries from registered institutions." />
      {tickets.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No support tickets have been raised yet.
        </div>
      ) : (
        <DataTable columns={columns} data={tickets} />
      )}
    </div>
  );
};

export default SupportTicketsPage;
