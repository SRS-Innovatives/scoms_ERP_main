import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { campusService, buildingService, roomService, ROOM_TYPES } from '../../services/infrastructureService';
import { Building2, Edit, Trash2, Plus } from 'lucide-react';

const TABS = [
  { key: 'campus', label: 'Campuses' },
  { key: 'building', label: 'Buildings & Floors' },
  { key: 'room', label: 'Rooms' },
];

const EMPTY = {
  campus: { code: '', name: '', address: '', city: '', capacity: '', isMain: false },
  building: { campusId: '', code: '', name: '', description: '', floorCount: '' },
  room: { buildingId: '', floorId: '', roomNumber: '', name: '', type: 'CLASSROOM', capacity: '' },
};

const SERVICES = { campus: campusService, building: buildingService, room: roomService };
const LABELS = { campus: 'Campus', building: 'Building', room: 'Room' };

const floorLabel = (f) => f.name || (f.floorNumber === 0 ? 'Ground Floor' : `Floor ${f.floorNumber}`);

const ActionButtons = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-2">
    <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
      <Edit className="w-3.5 h-3.5" />
    </button>
    <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

export const CampusSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('campus');
  const [campuses, setCampuses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(null); // { kind, id }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind, row }
  const [floorForm, setFloorForm] = useState(null); // { buildingId, floorNumber, name }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, b, r] = await Promise.all([campusService.getAll(), buildingService.getAll(), roomService.getAll()]);
      setCampuses(c.data || []);
      setBuildings(b.data || []);
      setRooms(r.data || []);
    } catch (error) {
      notifyError(`Failed to load infrastructure: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openModal = (kind, row = null) => {
    setModal({ kind, id: row?.id || null });
    if (!row) setForm(EMPTY[kind]);
    else if (kind === 'campus') setForm({ code: row.code, name: row.name, address: row.address || '', city: row.city || '', capacity: row.capacity ?? '', isMain: row.isMain, isActive: row.isActive });
    else if (kind === 'building') setForm({ campusId: row.campusId || '', code: row.code, name: row.name, description: row.description || '', isActive: row.isActive });
    else setForm({ buildingId: row.buildingId, floorId: row.floorId || '', roomNumber: row.roomNumber, name: row.name || '', type: row.type, capacity: row.capacity ?? '', isActive: row.isActive });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { kind, id } = modal;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (kind === 'building') payload.campusId = payload.campusId || null;
      if (kind === 'room' && id) delete payload.buildingId;
      if (id) await SERVICES[kind].update(id, payload);
      else await SERVICES[kind].create(payload);
      notifySuccess(`${LABELS[kind]} ${id ? 'updated' : 'created'} successfully!`);
      setModal(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save ${LABELS[kind].toLowerCase()}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { kind, row } = deleteTarget;
    try {
      if (kind === 'floor') await buildingService.removeFloor(row.id);
      else await SERVICES[kind].remove(row.id);
      notifySuccess('Deleted successfully.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleAddFloor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await buildingService.addFloor(floorForm.buildingId, { floorNumber: floorForm.floorNumber, name: floorForm.name });
      notifySuccess('Floor added.');
      setFloorForm(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add floor: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = {
    campus: [
      { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
      { header: 'Campus Name', key: 'name', render: (val, row) => <span className="font-bold text-slate-900 dark:text-white">{val}{row.isMain ? ' (Main)' : ''}</span> },
      { header: 'Location', key: 'city', render: (val, row) => [row.address, val].filter(Boolean).join(', ') || '-' },
      { header: 'Student Capacity', key: 'capacity', render: (val) => (val ? `${val.toLocaleString()} Seats` : '-') },
      { header: 'Buildings', key: '_count', sortable: false, render: (val) => val?.buildings ?? 0 },
      { header: 'Status', key: 'isActive', render: (val) => <StatusBadge status={val ? 'Active' : 'Inactive'} /> },
      { header: 'Actions', key: 'actions', sortable: false, render: (_, row) => <ActionButtons onEdit={() => openModal('campus', row)} onDelete={() => setDeleteTarget({ kind: 'campus', row })} /> },
    ],
    building: [
      { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
      { header: 'Building', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
      { header: 'Campus', key: 'campus', sortable: false, render: (val) => val?.name || '-' },
      {
        header: 'Floors',
        key: 'floors',
        sortable: false,
        render: (val, row) => (
          <div className="flex flex-wrap items-center gap-1">
            {(val || []).map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800">
                {floorLabel(f)}
                {f._count?.rooms === 0 && (
                  <button title="Delete floor" onClick={() => setDeleteTarget({ kind: 'floor', row: f })} className="text-slate-400 hover:text-rose-600">×</button>
                )}
              </span>
            ))}
            <button
              title="Add floor"
              onClick={() => setFloorForm({ buildingId: row.id, floorNumber: String((val || []).reduce((m, f) => Math.max(m, f.floorNumber + 1), 0)), name: '' })}
              className="p-0.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
      { header: 'Rooms', key: '_count', sortable: false, render: (val) => val?.rooms ?? 0 },
      { header: 'Status', key: 'isActive', render: (val) => <StatusBadge status={val ? 'Active' : 'Inactive'} /> },
      { header: 'Actions', key: 'actions', sortable: false, render: (_, row) => <ActionButtons onEdit={() => openModal('building', row)} onDelete={() => setDeleteTarget({ kind: 'building', row })} /> },
    ],
    room: [
      { header: 'Room', key: 'roomNumber', render: (val, row) => <span className="font-mono font-bold text-indigo-600">{row.building?.code}-{val}</span> },
      { header: 'Name', key: 'name', render: (val) => val || '-' },
      { header: 'Type', key: 'type' },
      { header: 'Building', key: 'building', sortable: false, render: (val) => val?.name || '-' },
      { header: 'Floor', key: 'floor', sortable: false, render: (val) => (val ? floorLabel(val) : '-') },
      { header: 'Capacity', key: 'capacity', render: (val) => val ?? '-' },
      { header: 'Status', key: 'isActive', render: (val) => <StatusBadge status={val ? 'Active' : 'Inactive'} /> },
      { header: 'Actions', key: 'actions', sortable: false, render: (_, row) => <ActionButtons onEdit={() => openModal('room', row)} onDelete={() => setDeleteTarget({ kind: 'room', row })} /> },
    ],
  };

  const q = search.toLowerCase();
  const data = { campus: campuses, building: buildings, room: rooms }[tab].filter(
    (r) => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q) || r.roomNumber?.toLowerCase().includes(q)
  );

  const selectedBuilding = buildings.find((b) => b.id === form.buildingId);
  const isEdit = !!modal?.id;
  const fields = {
    campus: [
      { name: 'code', label: 'Campus Code (e.g. MAIN)', required: true },
      { name: 'name', label: 'Campus Name', required: true },
      { name: 'address', label: 'Address', span: 'full' },
      { name: 'city', label: 'City' },
      { name: 'capacity', label: 'Student Capacity', type: 'number' },
      { name: 'isMain', label: 'Main campus', type: 'checkbox' },
      ...(isEdit ? [{ name: 'isActive', label: 'Active', type: 'checkbox' }] : []),
    ],
    building: [
      { name: 'campusId', label: 'Campus (optional)', type: 'select', span: 'full', placeholder: '- None -', options: campuses.map((c) => ({ value: c.id, label: c.name })) },
      { name: 'code', label: 'Building Code (e.g. BLK-A)', required: true },
      { name: 'name', label: 'Building Name', required: true },
      { name: 'description', label: 'Description', span: 'full' },
      ...(isEdit ? [{ name: 'isActive', label: 'Active', type: 'checkbox' }] : [{ name: 'floorCount', label: 'Number of floors (auto-create)', type: 'number' }]),
    ],
    room: [
      { name: 'buildingId', label: 'Building', type: 'select', required: true, span: 'full', disabled: isEdit, options: buildings.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })) },
      { name: 'floorId', label: 'Floor', type: 'select', placeholder: '- None -', options: (selectedBuilding?.floors || []).map((f) => ({ value: f.id, label: floorLabel(f) })) },
      { name: 'roomNumber', label: 'Room Number', required: true },
      { name: 'name', label: 'Room Name (optional)' },
      { name: 'type', label: 'Type', type: 'select', options: ROOM_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') })) },
      { name: 'capacity', label: 'Seating Capacity', type: 'number' },
      ...(isEdit ? [{ name: 'isActive', label: 'Active', type: 'checkbox' }] : []),
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Campus & Infrastructure Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Campuses, buildings, floors and rooms - shared by timetable, exam seating and hostel</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(''); }}
            className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder={`Search ${TABS.find((t) => t.key === tab).label.toLowerCase()}...`}
        addLabel={`Add ${LABELS[tab]}`}
        onAddClick={() => openModal(tab)}
        onRefreshClick={fetchAll}
      />

      {!loading && data.length === 0 ? (
        <EmptyState
          title={`No ${TABS.find((t) => t.key === tab).label} Found`}
          description={tab === 'room' ? 'Add a building first, then its rooms.' : `Add a ${LABELS[tab].toLowerCase()} to get started.`}
          actionLabel={`Add ${LABELS[tab]}`}
          onAction={() => openModal(tab)}
        />
      ) : (
        <DataTable columns={columns[tab]} data={data} loading={loading} />
      )}

      <FormModal
        isOpen={!!modal}
        title={modal ? `${isEdit ? 'Edit' : 'Add'} ${LABELS[modal.kind]}` : ''}
        icon={Building2}
        submitLabel={isEdit ? 'Save Changes' : 'Create'}
        isSubmitting={submitting}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value, ...(name === 'buildingId' && { floorId: '' }) }))}
        fields={modal ? fields[modal.kind] : []}
      />

      <FormModal
        isOpen={!!floorForm}
        title="Add Floor"
        subtitle="0 = Ground floor, negative numbers for basements"
        icon={Building2}
        submitLabel="Add Floor"
        isSubmitting={submitting}
        onClose={() => setFloorForm(null)}
        onSubmit={handleAddFloor}
        values={floorForm || {}}
        onChange={(name, value) => setFloorForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'floorNumber', label: 'Floor Number', type: 'number', required: true },
          { name: 'name', label: 'Name (optional)' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Confirm Delete"
        message={`Delete "${deleteTarget?.row?.name || deleteTarget?.row?.roomNumber || (deleteTarget?.row ? floorLabel(deleteTarget.row) : '')}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CampusSetupPage;
