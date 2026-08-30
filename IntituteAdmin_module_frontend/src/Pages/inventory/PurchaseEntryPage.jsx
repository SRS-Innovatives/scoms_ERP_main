import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { ShoppingCart } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const STATUS_OPTIONS = ['ORDERED', 'DELIVERED', 'CANCELLED'];
const emptyForm = { vendorId: '', items: '', totalAmount: '', orderDate: '' };

export const PurchaseEntryPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([inventoryService.getPurchaseOrders(), inventoryService.getVendors()])
      .then(([orderRes, vendorRes]) => {
        setOrders(orderRes.data || []);
        setVendors(vendorRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load purchase orders: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await inventoryService.createPurchaseOrder(form);
      notifySuccess(`Purchase order ${res.data.poNumber} created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create purchase order: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await inventoryService.updatePurchaseOrderStatus(id, status);
      notifySuccess(`Order marked as ${status}.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update status: ${error.message}`);
    }
  };

  const columns = [
    { header: 'PO Number', key: 'poNumber', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Vendor Name', key: 'vendor', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.name}</span> },
    { header: 'Purchased Items', key: 'items' },
    { header: 'Order Value (₹)', key: 'totalAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'PO Date', key: 'orderDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val, row) => (
        <select value={val} onChange={(e) => handleStatusChange(row.id, e.target.value)} className="text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Purchase Orders & Inward Entry</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Purchase order tracking through delivery</p>
        </div>
        <button onClick={() => setModalOpen(true)} disabled={vendors.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          <ShoppingCart className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {!loading && orders.length === 0 ? (
        <EmptyState
          title="No Purchase Orders Yet"
          description={vendors.length === 0 ? 'Add a vendor first under Vendor Management.' : 'Create the first purchase order.'}
          actionLabel={vendors.length > 0 ? 'Create Purchase Order' : undefined}
          onAction={vendors.length > 0 ? () => setModalOpen(true) : undefined}
          icon={ShoppingCart}
        />
      ) : (
        <DataTable columns={columns} data={orders} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Create Purchase Order"
        icon={ShoppingCart}
        submitLabel="Create Order"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'vendorId', label: 'Vendor', type: 'select', required: true, span: 'full', options: vendors.map((v) => ({ value: v.id, label: v.name })) },
          { name: 'items', label: 'Purchased Items (description)', required: true, span: 'full' },
          { name: 'totalAmount', label: 'Order Value (₹)', type: 'number', required: true },
          { name: 'orderDate', label: 'PO Date', type: 'date' },
        ]}
      />
    </div>
  );
};

export default PurchaseEntryPage;
