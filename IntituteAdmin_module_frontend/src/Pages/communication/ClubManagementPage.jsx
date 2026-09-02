import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Plus, Trash2, Users } from 'lucide-react';
import clubService from '../../services/clubService';

const emptyForm = { name: '', description: '', inchargeName: '' };

export const ClubManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clubService.getAll();
      setClubs(res.data || []);
    } catch (error) {
      notifyError(`Failed to load clubs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await clubService.create(form);
      notifySuccess(`Club "${form.name}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create club: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await clubService.remove(id);
      notifySuccess(`Club "${name}" removed.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Club Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Description', key: 'description', sortable: false, render: (val) => <span className="line-clamp-1 max-w-xs inline-block">{val || '—'}</span> },
    { header: 'Faculty In-charge', key: 'inchargeName', render: (val) => val || '—' },
    { header: 'Members', key: '_count', sortable: false, render: (val) => <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"><Users className="w-3.5 h-3.5" /> {val?.members ?? 0}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <button onClick={() => handleDelete(id, row.name)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Clubs & Societies</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Co-curricular clubs students can join from their portal</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>New Club</span>
        </button>
      </div>

      {!loading && clubs.length === 0 ? (
        <EmptyState title="No Clubs Yet" description="Set up your institution's first club or society." icon={Sparkles} actionLabel="New Club" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={clubs} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Create Club"
        subtitle="Visible to students, who can join directly from their portal"
        icon={Sparkles}
        submitLabel="Create"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Club Name', required: true, span: 'full' },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
          { name: 'inchargeName', label: 'Faculty In-charge' },
        ]}
      />
    </div>
  );
};

export default ClubManagementPage;
