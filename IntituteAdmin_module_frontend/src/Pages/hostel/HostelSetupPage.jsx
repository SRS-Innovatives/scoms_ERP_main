import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Home } from 'lucide-react';
import hostelService from '../../services/hostelService';

const emptyForm = { name: '', type: 'BOYS', warden: '', messType: '', capacity: '100' };

export const HostelSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    hostelService.getHostels()
      .then((res) => setHostels(res.data || []))
      .catch((err) => notifyError(`Failed to load hostel blocks: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelService.createHostel(form);
      notifySuccess(`Hostel block "${form.name}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create hostel block: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Hostel Block Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Home className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Type', key: 'type' },
    { header: 'Resident Warden', key: 'warden', render: (val) => val || '—' },
    { header: 'Total Capacity', key: 'capacity', render: (val) => `${val} Beds` },
    { header: 'Occupied Beds', key: 'occupiedBeds', render: (val) => <span className="font-bold text-indigo-600">{val} Occupied</span> },
    { header: 'Mess & Dining Type', key: 'messType', render: (val) => val || '—' },
  ];

  const filtered = hostels.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Blocks & Mess Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Boys & Girls hostel blocks, warden assignment & dining mess configuration</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search hostel block..." addLabel="Add Hostel Block" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Hostel Blocks Yet" description="Add the first hostel block to get started." actionLabel="Add Hostel Block" onAction={() => setModalOpen(true)} icon={Home} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Hostel Block"
        icon={Home}
        submitLabel="Create Hostel"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Hostel Block Name', required: true, span: 'full' },
          { name: 'type', label: 'Type', type: 'select', options: [{ value: 'BOYS', label: 'Boys' }, { value: 'GIRLS', label: 'Girls' }] },
          { name: 'warden', label: 'Resident Warden' },
          { name: 'messType', label: 'Mess & Dining Type (e.g. Veg Only)' },
          { name: 'capacity', label: 'Total Capacity (Beds)', type: 'number' },
        ]}
      />
    </div>
  );
};

export default HostelSetupPage;
