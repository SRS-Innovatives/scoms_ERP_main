import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Monitor } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const emptyForm = { labName: '', pcCount: '', specifications: '', operatingSystem: '', network: '' };

export const ComputerLabPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    inventoryService.getComputerLabs()
      .then((res) => setLabs(res.data || []))
      .catch((err) => { notifyError(`Failed to load computer labs: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createComputerLab(form);
      notifySuccess(`"${form.labName}" added successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add computer lab: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Lab Name', key: 'labName', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'System Count', key: 'pcCount', render: (val) => <span className="font-mono font-bold text-indigo-600">{val} PCs</span> },
    { header: 'Hardware Specification', key: 'specifications', render: (val) => val || '—' },
    { header: 'OS & Licensed Software', key: 'operatingSystem', render: (val) => val || '—' },
    { header: 'LAN Connectivity', key: 'network', render: (val) => val ? <StatusBadge status="Active" text={val} /> : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Computer Lab Infrastructure</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">High-performance workstations, network connectivity & software licenses</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <Monitor className="w-4 h-4" /> Add Computer Lab
        </button>
      </div>

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && labs.length === 0 ? (
        <EmptyState title="No Computer Labs Registered" description="Add the first computer lab to get started." actionLabel="Add Computer Lab" onAction={() => setModalOpen(true)} icon={Monitor} />
      ) : (
        <DataTable columns={columns} data={labs} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Computer Lab"
        icon={Monitor}
        submitLabel="Add Lab"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'labName', label: 'Lab Name', required: true, span: 'full' },
          { name: 'pcCount', label: 'System Count', type: 'number', required: true },
          { name: 'specifications', label: 'Hardware Specification', span: 'full' },
          { name: 'operatingSystem', label: 'OS & Licensed Software' },
          { name: 'network', label: 'LAN Connectivity (e.g. 1 Gbps Fibre)' },
        ]}
      />
    </div>
  );
};

export default ComputerLabPage;
