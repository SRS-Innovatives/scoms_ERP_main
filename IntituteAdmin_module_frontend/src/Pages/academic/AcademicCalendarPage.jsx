import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Trash2 } from 'lucide-react';
import academicCalendarService from '../../services/academicCalendarService';

const EVENT_TYPES = [
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'EVENT', label: 'Event' },
  { value: 'DEADLINE', label: 'Deadline' },
  { value: 'OTHER', label: 'Other' },
];

const TYPE_STYLES = {
  HOLIDAY: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400',
  EXAM: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  EVENT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400',
  DEADLINE: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400',
  OTHER: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

const emptyForm = { title: '', description: '', eventType: 'EVENT', startDate: '', endDate: '' };

export const AcademicCalendarPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    academicCalendarService.getEvents()
      .then((res) => setEvents(res.data || []))
      .catch((err) => { notifyError(`Failed to load calendar: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await academicCalendarService.createEvent({ ...form, endDate: form.endDate || undefined });
      notifySuccess(`"${form.title}" added to the calendar!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to add event: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await academicCalendarService.deleteEvent(id);
      notifySuccess('Event deleted');
      fetchAll();
    } catch (err) {
      notifyError(`Delete failed: ${err.message}`);
    }
  };

  const columns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Type', key: 'eventType', render: (val) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLES[val] || TYPE_STYLES.OTHER}`}>{val}</span> },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    { header: 'End Date', key: 'endDate', render: (val) => val ? <span className="font-mono">{new Date(val).toLocaleDateString()}</span> : '—' },
    { header: 'Description', key: 'description', render: (val) => val || '—' },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id) => <button onClick={() => handleDelete(id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>,
    },
  ];

  const filtered = events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Calendar</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Holidays, exam windows, events and deadlines — visible across every portal</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} placeholder="Search events..." addLabel="Add Event" onAddClick={() => setModalOpen(true)} />

      {!loading && error ? (
        <ErrorState onRetry={fetchAll} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState title="No Events Yet" description="Add the first calendar event." actionLabel="Add Event" onAction={() => setModalOpen(true)} icon={Calendar} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Calendar Event"
        icon={Calendar}
        submitLabel="Add Event"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Event Title', required: true, span: 'full' },
          { name: 'eventType', label: 'Type', type: 'select', options: EVENT_TYPES, required: true },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date (optional)', type: 'date' },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default AcademicCalendarPage;
