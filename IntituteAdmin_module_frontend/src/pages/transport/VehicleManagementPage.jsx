import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Bus } from 'lucide-react';
import transportService from '../../services/transportService';
import ErrorState from '../../components/common/ErrorState';

const emptyForm = {
  vehicleNumber: '', vehicleType: 'BUS', capacity: '40', driverName: '', driverPhone: '',
  driverLicenseNumber: '', licenseExpiryDate: '', fcExpiryDate: '', insuranceExpiryDate: '', gpsEnabled: false,
};

export const VehicleManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    transportService.getVehicles()
      .then((res) => setVehicles(res.data || []))
      .catch((err) => { notifyError(`Failed to load fleet: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportService.createVehicle(form);
      notifySuccess(`Vehicle ${form.vehicleNumber} added to fleet successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add vehicle: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isExpiringSoon = (date) => date && new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const columns = [
    { header: 'Bus Reg Number', key: 'vehicleNumber', render: (val) => <span className="font-mono font-bold text-indigo-600 flex items-center gap-2"><Bus className="w-4 h-4" />{val}</span> },
    { header: 'Type', key: 'vehicleType', render: (val) => val.replace('_', ' ') },
    { header: 'Capacity', key: 'capacity', render: (val) => `${val} Seats` },
    { header: 'FC Expiry', key: 'fcExpiryDate', render: (val) => val ? <span className={`font-mono ${isExpiringSoon(val) ? 'text-rose-600 font-bold' : ''}`}>{new Date(val).toLocaleDateString('en-IN')}</span> : '—' },
    { header: 'Insurance Valid Till', key: 'insuranceExpiryDate', render: (val) => val ? <span className={`font-mono ${isExpiringSoon(val) ? 'text-rose-600 font-bold' : ''}`}>{new Date(val).toLocaleDateString('en-IN')}</span> : '—' },
    { header: 'GPS Status', key: 'gpsEnabled', render: (val) => <StatusBadge status={val ? 'Active' : 'Inactive'} text={val ? 'GPS ONLINE' : 'NO GPS'} /> },
  ];

  const filtered = vehicles.filter((v) => v.vehicleNumber.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fleet & Vehicle Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Fitness Certificate (FC), insurance renewals & GPS tracking status</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search bus registration..." addLabel="Add Vehicle" onAddClick={() => setModalOpen(true)} />

      {error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState title="No Vehicles in Fleet" description="Add the first vehicle to the transport fleet." actionLabel="Add Vehicle" onAction={() => setModalOpen(true)} icon={Bus} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Vehicle to Fleet"
        icon={Bus}
        submitLabel="Add Vehicle"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'vehicleNumber', label: 'Vehicle Registration Number', required: true, span: 'full' },
          { name: 'vehicleType', label: 'Vehicle Type', type: 'select', options: [{ value: 'BUS', label: 'Bus' }, { value: 'MINI_BUS', label: 'Mini Bus' }, { value: 'VAN', label: 'Van' }] },
          { name: 'capacity', label: 'Seating Capacity', type: 'number' },
          { name: 'driverName', label: 'Driver Name' },
          { name: 'driverPhone', label: 'Driver Phone' },
          { name: 'driverLicenseNumber', label: 'Driver License Number' },
          { name: 'licenseExpiryDate', label: 'License Expiry', type: 'date' },
          { name: 'fcExpiryDate', label: 'FC Expiry Date', type: 'date' },
          { name: 'insuranceExpiryDate', label: 'Insurance Expiry Date', type: 'date' },
          { name: 'gpsEnabled', label: 'GPS Tracker Fitted', type: 'checkbox' },
        ]}
      />
    </div>
  );
};

export default VehicleManagementPage;
