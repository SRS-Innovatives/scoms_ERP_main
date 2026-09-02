import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Bus } from 'lucide-react';
import transportService from '../../services/transportService';

const emptyForm = { routeName: '', startPoint: '', endPoint: '', monthlyFare: '', vehicleId: '' };

export const RouteManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([transportService.getRoutes(), transportService.getVehicles()])
      .then(([routeRes, vehicleRes]) => {
        setRoutes(routeRes.data || []);
        setVehicles(vehicleRes.data || []);
      })
      .catch((err) => notifyError(`Failed to load routes: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transportService.createRoute(form);
      notifySuccess(`Route "${form.routeName}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create route: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Route Corridor Name', key: 'routeName', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bus className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Corridor', key: 'startPoint', sortable: false, render: (_, row) => `${row.startPoint} → ${row.endPoint}` },
    { header: 'Assigned Bus', key: 'vehicle', sortable: false, render: (val) => val ? <span className="font-mono font-bold">{val.vehicleNumber}</span> : <span className="text-slate-400">Unassigned</span> },
    { header: 'Students Mapped', key: '_count', sortable: false, render: (val) => `${val?.mappings ?? 0} students` },
    { header: 'Monthly Fee (₹)', key: 'monthlyFare', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
  ];

  const filtered = routes.filter((r) => r.routeName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Route Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pickup corridors, vehicle assignment & monthly fare configuration</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search bus route..." addLabel="Add Transport Route" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Routes Configured" description="Add the first transport route to get started." actionLabel="Add Transport Route" onAction={() => setModalOpen(true)} icon={Bus} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Transport Route"
        icon={Bus}
        submitLabel="Create Route"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'routeName', label: 'Route Corridor Name', required: true, span: 'full' },
          { name: 'startPoint', label: 'Start Point', required: true },
          { name: 'endPoint', label: 'End Point', required: true },
          { name: 'monthlyFare', label: 'Monthly Fee (₹)', type: 'number', required: true },
          { name: 'vehicleId', label: 'Assign Vehicle (optional)', type: 'select', options: vehicles.map((v) => ({ value: v.id, label: v.vehicleNumber })) },
        ]}
      />
    </div>
  );
};

export default RouteManagementPage;
