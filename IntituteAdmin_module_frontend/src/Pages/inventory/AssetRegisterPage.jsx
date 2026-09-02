import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Package } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const CONDITION_OPTIONS = [
  { value: 'GOOD', label: 'Good' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'DISPOSED', label: 'Disposed' },
];

const emptyForm = { assetTag: '', name: '', category: '', location: '', quantity: '1', condition: 'GOOD', purchaseDate: '', purchaseValue: '', vendorId: '' };

export const AssetRegisterPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([inventoryService.getAssets(), inventoryService.getVendors()])
      .then(([assetRes, vendorRes]) => {
        setAssets(assetRes.data || []);
        setVendors(vendorRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load assets: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createAsset(form);
      notifySuccess(`"${form.name}" added to the asset register!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add asset: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Asset Tag ID', key: 'assetTag', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Asset Description', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Campus Location', key: 'location', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val || '—'}</span> },
    { header: 'Quantity', key: 'quantity', render: (val) => <span className="font-mono font-bold">{val} Units</span> },
    { header: 'Purchase Date', key: 'purchaseDate', render: (val) => val ? <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> : '—' },
    { header: 'Condition', key: 'condition', render: (val) => <StatusBadge status={val === 'GOOD' ? 'Active' : val === 'DISPOSED' ? 'Inactive' : 'Pending'} text={val.replace('_', ' ')} /> },
  ];

  const filtered = assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.assetTag.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Fixed Asset Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Asset tag tracking for furniture, projectors, servers & lab instruments</p>
        </div>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search asset tag or name..." addLabel="Add Asset Item" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Assets Registered Yet" description="Add the first fixed asset to the register." actionLabel="Add Asset Item" onAction={() => setModalOpen(true)} icon={Package} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Asset Item"
        icon={Package}
        submitLabel="Add Asset"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'assetTag', label: 'Asset Tag ID', required: true },
          { name: 'name', label: 'Asset Description', required: true },
          { name: 'category', label: 'Category (e.g. Furniture, IT Equipment)', required: true },
          { name: 'location', label: 'Campus Location / Room' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'condition', label: 'Condition', type: 'select', options: CONDITION_OPTIONS },
          { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
          { name: 'purchaseValue', label: 'Purchase Value (₹)', type: 'number' },
          { name: 'vendorId', label: 'Vendor (optional)', type: 'select', options: vendors.map((v) => ({ value: v.id, label: v.name })) },
        ]}
      />
    </div>
  );
};

export default AssetRegisterPage;
