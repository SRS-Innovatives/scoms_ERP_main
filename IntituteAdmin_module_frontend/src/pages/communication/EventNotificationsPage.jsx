import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Plus, Trash2, Users } from 'lucide-react';
import eventService from '../../services/eventService';

const emptyForm = { title: '', description: '', eventDate: '', venue: '' };

export const EventNotificationsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventService.getAll();
      setEvents(res.data || []);
    } catch (error) {
      notifyError(`Failed to load events: ${error.message}`);
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
      await eventService.create(form);
      notifySuccess(`Event "${form.title}" published to the campus calendar!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to publish event: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    try {
      await eventService.remove(id);
      notifySuccess(`Event "${title}" removed.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    }
  };

  const isUpcoming = (date) => new Date(date) >= new Date(new Date().toDateString());

  const columns = [
    { header: 'Event Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Event Date', key: 'eventDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Venue', key: 'venue', render: (val) => val || '—' },
    { header: 'Registrations', key: '_count', sortable: false, render: (val) => <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"><Users className="w-3.5 h-3.5" /> {val?.registrations ?? 0}</span> },
    { header: 'Status', key: 'eventDate', sortable: false, render: (val) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isUpcoming(val) ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
        {isUpcoming(val) ? 'Upcoming' : 'Past'}
      </span>
    ) },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <button onClick={() => handleDelete(id, row.title)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Campus Events Calendar & Reminders</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Technical symposiums, annual sports, cultural events & parent-teacher meetings</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {!loading && events.length === 0 ? (
        <EmptyState title="No Events Scheduled" description="Publish your institution's first campus event." actionLabel="Publish New Event" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={events} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Publish Campus Event"
        subtitle="Visible to staff and students; students can register directly from their portal"
        icon={Calendar}
        submitLabel="Publish"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Event Title', required: true, span: 'full' },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
          { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
          { name: 'venue', label: 'Venue' },
        ]}
      />
    </div>
  );
};

export default EventNotificationsPage;
