import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Boxes, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const emptyItemForm = { name: '', category: '', unit: 'Units', quantity: '0', reorderLevel: '10', location: '' };
const emptyTxnForm = { stockItemId: '', type: 'IN', quantity: '', reason: '' };

export const StockInOutPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([inventoryService.getStockItems(), inventoryService.getStockTransactions()])
      .then(([itemRes, txnRes]) => {
        setItems(itemRes.data || []);
        setTransactions(txnRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load stock register: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createStockItem(itemForm);
      notifySuccess(`"${itemForm.name}" added to stock register!`);
      setItemModalOpen(false);
      setItemForm(emptyItemForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add stock item: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.recordStockTransaction(txnForm);
      notifySuccess(`Stock ${txnForm.type === 'IN' ? 'inward' : 'outward'} entry recorded!`);
      setTxnModalOpen(false);
      setTxnForm(emptyTxnForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to record transaction: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    { header: 'Item Description', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Category', key: 'category', render: (val) => val || '—' },
    { header: 'Current Stock', key: 'quantity', render: (val, row) => <span className={`font-mono font-bold ${val <= row.reorderLevel ? 'text-rose-600' : 'text-indigo-600'}`}>{val} {row.unit}</span> },
    { header: 'Reorder Level', key: 'reorderLevel', render: (val, row) => `${val} ${row.unit}` },
    { header: 'Store Location', key: 'location', render: (val) => val || '—' },
  ];

  const txnColumns = [
    { header: 'Item', key: 'stockItem', sortable: false, render: (val) => val?.name },
    { header: 'Type', key: 'type', sortable: false, render: (val) => val === 'IN' ? <span className="flex items-center gap-1 text-emerald-600 font-bold"><ArrowDownCircle className="w-3.5 h-3.5" /> IN</span> : <span className="flex items-center gap-1 text-rose-600 font-bold"><ArrowUpCircle className="w-3.5 h-3.5" /> OUT</span> },
    { header: 'Quantity', key: 'quantity', sortable: false, render: (val, row) => `${val} ${row.stockItem?.unit}` },
    { header: 'Reason', key: 'reason', render: (val) => val || '—' },
    { header: 'By', key: 'performedBy', render: (val) => val || '—' },
    { header: 'Date', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Store Consumables & Stock Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Stationery, printing paper, toner cartridges, lab consumables & cleaning supplies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setItemModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button onClick={() => setTxnModalOpen(true)} disabled={items.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
            <Boxes className="w-4 h-4" /> Record Stock In/Out
          </button>
        </div>
      </div>

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && items.length === 0 ? (
        <EmptyState title="No Stock Items Yet" description="Add the first consumable item to the stock register." actionLabel="Add Item" onAction={() => setItemModalOpen(true)} icon={Boxes} />
      ) : (
        <DataTable columns={itemColumns} data={items} loading={loading} />
      )}

      {!error && transactions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Stock Movements</h3>
          <DataTable columns={txnColumns} data={transactions} />
        </div>
      )}

      <FormModal
        isOpen={itemModalOpen}
        title="Add Stock Item"
        icon={Boxes}
        submitLabel="Add Item"
        isSubmitting={submitting}
        onClose={() => setItemModalOpen(false)}
        onSubmit={handleAddItem}
        values={itemForm}
        onChange={(name, value) => setItemForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Item Description', required: true, span: 'full' },
          { name: 'category', label: 'Category (e.g. Stationery)' },
          { name: 'unit', label: 'Unit (e.g. Reams, Boxes)' },
          { name: 'quantity', label: 'Opening Stock Qty', type: 'number' },
          { name: 'reorderLevel', label: 'Reorder Level', type: 'number' },
          { name: 'location', label: 'Store Location' },
        ]}
      />

      <FormModal
        isOpen={txnModalOpen}
        title="Record Stock In/Out"
        icon={Boxes}
        submitLabel="Record Entry"
        isSubmitting={submitting}
        onClose={() => setTxnModalOpen(false)}
        onSubmit={handleTransaction}
        values={txnForm}
        onChange={(name, value) => setTxnForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'stockItemId', label: 'Item', type: 'select', required: true, span: 'full', options: items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in stock)` })) },
          { name: 'type', label: 'Movement Type', type: 'select', required: true, options: [{ value: 'IN', label: 'Stock In' }, { value: 'OUT', label: 'Stock Out' }] },
          { name: 'quantity', label: 'Quantity', type: 'number', required: true },
          { name: 'reason', label: 'Reason / Remarks', span: 'full' },
        ]}
      />
    </div>
  );
};

export default StockInOutPage;
