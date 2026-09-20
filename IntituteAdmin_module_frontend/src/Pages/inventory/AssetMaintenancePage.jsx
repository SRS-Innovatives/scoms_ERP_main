import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Wrench, CheckCircle2, PlayCircle } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const emptyForm = { assetId: '', description: '', scheduledDate: '', vendorId: '', cost: '', notes: '' };

export const AssetMaintenancePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([inventoryService.getMaintenanceRecords(), inventoryService.getAssets(), inventoryService.getVendors()])
      .then(([recRes, assetRes, vendorRes]) => {
        setRecords(recRes.data || []);
        setAssets(assetRes.data || []);
        setVendors(vendorRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load maintenance records: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.scheduleMaintenance({ ...form, cost: form.cost ? Number(form.cost) : undefined });
      notifySuccess('Maintenance scheduled successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to schedule maintenance: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await inventoryService.updateMaintenanceStatus(id, { status });
      notifySuccess(`Marked as ${status.replace('_', ' ').toLowerCase()}`);
      fetchAll();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const columns = [
    { header: 'Asset', key: 'asset', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.name}</span> },
    { header: 'Description', key: 'description' },
    { header: 'Scheduled', key: 'scheduledDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    { header: 'Vendor', key: 'vendor', render: (val) => val?.name || '—' },
    { header: 'Cost', key: 'cost', render: (val) => val ? <span className="font-mono">₹{val.toLocaleString('en-IN')}</span> : '—' },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'SCHEDULED' && (
            <button onClick={() => handleStatusChange(id, 'IN_PROGRESS')} className="p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600" title="Start"><PlayCircle className="w-3.5 h-3.5" /></button>
          )}
          {row.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusChange(id, 'COMPLETED')} className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600" title="Complete"><CheckCircle2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
      ),
    },
  ];

  const filtered = records.filter((r) => r.description.toLowerCase().includes(search.toLowerCase()) || r.asset?.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Asset Maintenance</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Service, repair and calibration events — completing one resets the asset's condition to Good</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by asset or description..." addLabel="Schedule Maintenance" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Maintenance Scheduled" description="Schedule the first service/repair event." actionLabel="Schedule Maintenance" onAction={() => setModalOpen(true)} icon={Wrench} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Schedule Maintenance"
        icon={Wrench}
        submitLabel="Schedule"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'assetId', label: 'Asset', type: 'select', required: true, span: 'full', options: assets.map((a) => ({ value: a.id, label: `${a.name} (${a.assetTag})` })) },
          { name: 'description', label: 'Work Description', required: true, span: 'full' },
          { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
          { name: 'vendorId', label: 'Vendor (optional)', type: 'select', options: vendors.map((v) => ({ value: v.id, label: v.name })) },
          { name: 'cost', label: 'Estimated Cost (₹)', type: 'number' },
          { name: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default AssetMaintenancePage;
