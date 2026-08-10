import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockInvoices } from '../../data/mockBillingData';
import { Printer, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvoicesPage = () => {
  const navigate = useNavigate();

  const columns = [
    { header: 'Invoice No', key: 'invoiceNo', render: (v) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{v}</span> },
    { header: 'Institution', key: 'institution', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'GSTIN', key: 'gstin', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { header: 'Base Amount', key: 'baseAmount', render: (v) => `₹${v.toLocaleString()}` },
    { header: 'Total (GST Incl.)', key: 'totalAmount', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v.toLocaleString()}</span> },
    { header: 'Mode', key: 'paymentMode' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/super-admin/invoices/${id}`)}
            title="View & Print GST Invoice"
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform GST Invoices & Billing"
        subtitle="Manage Indian GST tax compliance, CGST/SGST/IGST breakdowns, SAC codes, and invoice PDFs."
        actionLabel="Generate New Invoice"
        onAction={() => navigate('/super-admin/invoices/new')}
      />

      <DataTable columns={columns} data={mockInvoices} />
    </div>
  );
};

export default InvoicesPage;
