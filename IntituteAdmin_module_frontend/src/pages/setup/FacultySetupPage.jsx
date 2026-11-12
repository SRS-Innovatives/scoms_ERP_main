import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import facultyService from '../../services/facultyService';
import { Landmark, Edit, Trash2 } from 'lucide-react';

const emptyForm = { code: '', name: '', description: '' };

/** Faculties / Schools — the university-level grouping above Departments
 * (e.g. "School of Engineering"). Only used when the faculty level is enabled. */
export const FacultySetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const academic = useAcademic();
  const unit = academic.label('faculty');
  const enabled = academic.isLevelEnabled('faculty');
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facultyService.getAll();
      setFaculties(res.data || []);
    } catch (error) {
      notifyError(`Failed to load ${unit.toLowerCase()} list: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError, unit]);

  useEffect(() => {
    if (enabled) fetchAll();
  }, [enabled, fetchAll]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingId(row.id);
    setForm({ code: row.code, name: row.name, description: row.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await facultyService.update(editingId, form);
        notifySuccess(`${form.name} updated successfully!`);
      } else {
        await facultyService.create(form);
        notifySuccess(`${form.name} created successfully!`);
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await facultyService.remove(deleteTarget.id);
      notifySuccess(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
      setDeleteTarget(null);
    }
  };

  if (!enabled) {
    return (
      <EmptyState
        title={`${unit} level is not used by this institution`}
        description={`${academic.label('department')}s sit directly under the institution. Your platform administrator can enable this level if needed.`}
      />
    );
  }

  const columns = [
    { header: 'Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: `${unit} Name`, key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: `${academic.label('department')}s`, key: '_count', sortable: false, render: (val) => `${val?.departments ?? 0} ${academic.label('department')}s` },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const q = search.toLowerCase();
  const filtered = faculties.filter((f) => f.name?.toLowerCase().includes(q) || f.code?.toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{unit} Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Group {academic.label('department').toLowerCase()}s under faculties / schools (e.g. School of Engineering)</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search by name or code..." addLabel={`Add ${unit}`} onAddClick={openAddModal} onRefreshClick={fetchAll} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="Nothing Added Yet" description={`Add a ${unit.toLowerCase()}, then link ${academic.label('department').toLowerCase()}s to it from ${academic.label('department')} Setup.`} actionLabel={`Add ${unit}`} onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? `Edit ${unit}` : `Add ${unit}`}
        subtitle="Define code, name and description"
        icon={Landmark}
        submitLabel={editingId ? 'Save Changes' : 'Create'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'code', label: 'Code (e.g. SOE)', required: true },
          { name: 'name', label: 'Name (e.g. School of Engineering)', required: true },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${unit}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FacultySetupPage;
