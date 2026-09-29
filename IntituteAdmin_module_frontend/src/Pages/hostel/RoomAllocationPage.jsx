import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { BedDouble, Plus, LogOut } from 'lucide-react';
import hostelService from '../../services/hostelService';
import studentService from '../../services/studentService';

const emptyBedForm = { hostelId: '', roomNumber: '', bedNumber: '', monthlyFee: '5000' };
const emptyAllocForm = { bedId: '', studentId: '' };

export const RoomAllocationPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [beds, setBeds] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bedForm, setBedForm] = useState(emptyBedForm);
  const [allocForm, setAllocForm] = useState(emptyAllocForm);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([hostelService.getBeds(), hostelService.getHostels(), studentService.getAll()])
      .then(([bedRes, hostelRes, studentRes]) => {
        setBeds(bedRes.data || []);
        setHostels(hostelRes.data || []);
        setStudents(studentRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load hostel beds: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelService.createBed(bedForm);
      notifySuccess('Bed added to room inventory successfully!');
      setBedModalOpen(false);
      setBedForm(emptyBedForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add bed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hostelService.allocateBed(allocForm);
      notifySuccess('Bed allocated to student successfully!');
      setAllocModalOpen(false);
      setAllocForm(emptyAllocForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to allocate bed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVacate = async (id) => {
    setBusyId(id);
    try {
      await hostelService.vacateBed(id);
      notifySuccess('Bed vacated successfully.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to vacate bed: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const vacantBeds = beds.filter((b) => !b.isOccupied);

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  const columns = [
    { header: 'Room / Bed', key: 'roomNumber', sortable: false, render: (val, row) => <span className="font-mono font-bold text-indigo-600">{val} / {row.bedNumber}</span> },
    { header: 'Hostel Block', key: 'hostel', sortable: false, render: (val) => `${val?.name} (${val?.type})` },
    { header: 'Monthly Fee (₹)', key: 'monthlyFee', render: (val) => <span className="font-mono">₹{val.toLocaleString()}</span> },
    { header: 'Occupant', key: 'student', sortable: false, render: (val) => val ? <span className="font-bold text-slate-900 dark:text-white">{val.firstName} {val.lastName} ({val.rollNumber})</span> : <span className="text-slate-400">Vacant</span> },
    { header: 'Status', key: 'isOccupied', render: (val) => <StatusBadge status={val ? 'Occupied' : 'Vacant'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => row.isOccupied && (
        <button onClick={() => handleVacate(id)} disabled={busyId === id} className="flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-xs font-semibold disabled:opacity-50">
          <LogOut className="w-3.5 h-3.5" /> Vacate
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Room & Bed Allocation Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage room/bed inventory and allocate beds to resident students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBedModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold">
            <Plus className="w-4 h-4" /> Add Bed
          </button>
          <button onClick={() => setAllocModalOpen(true)} disabled={vacantBeds.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
            <BedDouble className="w-4 h-4" /> Allocate Bed
          </button>
        </div>
      </div>

      {!loading && beds.length === 0 ? (
        <EmptyState title="No Beds in Inventory" description="Add the first bed to a hostel block to get started." actionLabel="Add Bed" onAction={() => setBedModalOpen(true)} icon={BedDouble} />
      ) : (
        <DataTable columns={columns} data={beds} loading={loading} />
      )}

      <FormModal
        isOpen={bedModalOpen}
        title="Add Bed to Room Inventory"
        icon={BedDouble}
        submitLabel="Add Bed"
        isSubmitting={submitting}
        onClose={() => setBedModalOpen(false)}
        onSubmit={handleAddBed}
        values={bedForm}
        onChange={(name, value) => setBedForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'hostelId', label: 'Hostel Block', type: 'select', required: true, span: 'full', options: hostels.map((h) => ({ value: h.id, label: h.name })) },
          { name: 'roomNumber', label: 'Room Number', required: true },
          { name: 'bedNumber', label: 'Bed Number', required: true },
          { name: 'monthlyFee', label: 'Monthly Fee (₹)', type: 'number' },
        ]}
      />

      <FormModal
        isOpen={allocModalOpen}
        title="Allocate Bed to Student"
        icon={BedDouble}
        submitLabel="Allocate"
        isSubmitting={submitting}
        onClose={() => setAllocModalOpen(false)}
        onSubmit={handleAllocate}
        values={allocForm}
        onChange={(name, value) => setAllocForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'bedId', label: 'Vacant Bed', type: 'select', required: true, span: 'full', options: vacantBeds.map((b) => ({ value: b.id, label: `${b.hostel?.name} — Room ${b.roomNumber} / Bed ${b.bedNumber}` })) },
        ]}
      />
    </div>
  );
};

export default RoomAllocationPage;
