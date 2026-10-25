import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { FlaskConical } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const emptyForm = { assetTag: '', name: '', category: 'Lab Instrument', location: '', quantity: '1', calibrationDueDate: '' };

export const LabEquipmentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    inventoryService.getAssets()
      .then((res) => setEquipment((res.data || []).filter((a) => a.calibrationDueDate)))
      .catch((err) => { notifyError(`Failed to load lab equipment: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.createAsset(form);
      notifySuccess(`"${form.name}" added to lab equipment register!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add equipment: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (date) => new Date(date) < new Date();

  const columns = [
    { header: 'Asset Tag', key: 'assetTag', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Instrument Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Lab Location', key: 'location', render: (val) => val || '—' },
    { header: 'Calibration Due Date', key: 'calibrationDueDate', render: (val) => <span className={`font-mono text-xs font-bold ${isOverdue(val) ? 'text-rose-600' : 'text-amber-600'}`}>{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'calibrationDueDate2', sortable: false, render: (_, row) => <StatusBadge status={isOverdue(row.calibrationDueDate) ? 'Inactive' : 'Active'} text={isOverdue(row.calibrationDueDate) ? 'Calibration Overdue' : 'Calibrated & Operational'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Engineering & Science Lab Equipment</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Instruments with a calibration schedule — VLSI kits, CROs, testers & lab machinery</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <FlaskConical className="w-4 h-4" /> Add Lab Equipment
        </button>
      </div>

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && equipment.length === 0 ? (
        <EmptyState title="No Lab Equipment Registered" description="Add the first calibrated instrument to the register." actionLabel="Add Lab Equipment" onAction={() => setModalOpen(true)} icon={FlaskConical} />
      ) : (
        <DataTable columns={columns} data={equipment} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Lab Equipment"
        icon={FlaskConical}
        submitLabel="Add Equipment"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'assetTag', label: 'Equipment Tag ID', required: true },
          { name: 'name', label: 'Instrument Name', required: true },
          { name: 'category', label: 'Category', required: true },
          { name: 'location', label: 'Lab Location' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'calibrationDueDate', label: 'Calibration Due Date', type: 'date', required: true },
        ]}
      />
    </div>
  );
};

export default LabEquipmentPage;
