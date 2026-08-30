import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import GenerateInvoiceModal from '../../components/modals/GenerateInvoiceModal';
import { useNotification } from '../../context/NotificationContext';
import billingService from '../../services/billingService';
import { Printer, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingService.getInvoices({ limit: 100 });
      setInvoices(res.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load invoices', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleMarkPaid = async (invoice) => {
    try {
      await billingService.updateInvoiceStatus(invoice.id, 'PAID', invoice.paymentMode);
      success(`Invoice ${invoice.invoiceNumber} marked as PAID.`, 'Invoice Updated');
      fetchInvoices();
    } catch (err) {
      showError(err.message || 'Failed to update invoice', 'Update Failed');
    }
  };

  const columns = [
    { header: 'Invoice No', key: 'invoiceNumber', render: (v) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{v}</span> },
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v?.name}</span> },
    { header: 'GSTIN', key: 'institutionGstin', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { header: 'Base Amount', key: 'baseAmount', render: (v) => `₹${v.toLocaleString('en-IN')}` },
    { header: 'Total (GST Incl.)', key: 'totalAmount', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">₹{v.toLocaleString('en-IN')}</span> },
    { header: 'Mode', key: 'paymentMode', render: (v) => v || '—' },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'PAID' && (
            <button
              onClick={() => handleMarkPaid(row)}
              title="Mark as Paid"
              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Paid
            </button>
          )}
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
        onAction={() => setModalOpen(true)}
      />

      {loading ? (
        <LoadingState message="Loading invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState title="No Invoices Yet" message="Generate your first GST invoice for an institution's subscription." actionLabel="Generate New Invoice" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={invoices} />
      )}

      <GenerateInvoiceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onGenerated={fetchInvoices} />
    </div>
  );
};

export default InvoicesPage;
