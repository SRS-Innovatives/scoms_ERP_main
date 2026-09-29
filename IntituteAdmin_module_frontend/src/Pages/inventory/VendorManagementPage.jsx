import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Truck } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const emptyForm = { name: '', category: '', gstNumber: '', phone: '', email: '' };

export const VendorManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    inventoryService.getVendors()
      .then((res) => setVendors(res.data || []))
      .catch((err) => { notifyError(`Failed to load vendors: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createVendor(form);
      notifySuccess(`Vendor "${form.name}" added successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add vendor: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Vendor Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Supply Category', key: 'category', render: (val) => val || '—' },
    { header: 'GSTIN Number', key: 'gstNumber', render: (val) => <span className="font-mono text-xs font-bold">{val || '—'}</span> },
    { header: 'Phone', key: 'phone', render: (val) => <span className="font-mono">{val || '—'}</span> },
    { header: 'Email', key: 'email', render: (val) => val || '—' },
  ];

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vendor & Supplier Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Approved vendor master directory, GSTIN numbers & contact info</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search vendor name..." addLabel="Add Vendor" onAddClick={() => setModalOpen(true)} />

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState title="No Vendors Yet" description="Add the first approved vendor to the directory." actionLabel="Add Vendor" onAction={() => setModalOpen(true)} icon={Truck} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Vendor"
        icon={Truck}
        submitLabel="Add Vendor"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Vendor Name', required: true, span: 'full' },
          { name: 'category', label: 'Supply Category (e.g. IT Hardware)' },
          { name: 'gstNumber', label: 'GSTIN Number' },
          { name: 'phone', label: 'Phone' },
          { name: 'email', label: 'Email' },
        ]}
      />
    </div>
  );
};

export default VendorManagementPage;
