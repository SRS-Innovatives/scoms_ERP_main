import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import enquiryService from '../../services/enquiryService';
import { UserPlus, Phone, Mail } from 'lucide-react';

const emptyForm = {
  studentName: '', parentName: '', phone: '', email: '', classAppliedFor: '', source: 'WALK_IN', followUpDate: '', notes: '',
};

const SOURCES = ['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'];
const STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST'];

const STATUS_STYLES = {
  NEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  CONTACTED: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  FOLLOW_UP: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  CONVERTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  LOST: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export const EnquiryManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enquiryService.getAll();
      setEnquiries(res.data || []);
    } catch (error) {
      notifyError(`Failed to load enquiries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await enquiryService.create(form);
      notifySuccess(`Enquiry for ${form.studentName} logged successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to log enquiry: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (row, status) => {
    try {
      await enquiryService.update(row.id, { status });
      notifySuccess(`Enquiry marked as ${status.replace('_', ' ')}`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update: ${error.message}`);
    }
  };

  const columns = [
    {
      header: 'Student', key: 'studentName',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val}</p>
          {row.classAppliedFor && <p className="text-[10px] text-slate-400">Class {row.classAppliedFor}</p>}
        </div>
      ),
    },
    { header: 'Parent', key: 'parentName', render: (val) => val || '—' },
    {
      header: 'Contact', key: 'phone', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2 text-xs">
          <a href={`tel:${row.phone}`} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}>
            <Phone className="w-3 h-3" /> {row.phone}
          </a>
          {row.email && <Mail className="w-3 h-3 text-slate-400" title={row.email} />}
        </div>
      ),
    },
    { header: 'Source', key: 'source', render: (val) => <span className="text-[10px] font-semibold text-slate-500 uppercase">{val.replace('_', ' ')}</span> },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 ${STATUS_STYLES[val] || STATUS_STYLES.NEW}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      ),
    },
    { header: 'Follow-up', key: 'followUpDate', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  const filtered = enquiries.filter((en) =>
    en.studentName?.toLowerCase().includes(search.toLowerCase()) || en.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admission Enquiries</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Track walk-in, phone and website enquiries through to admission conversion</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student name or phone..."
        addLabel="Log Enquiry"
        onAddClick={() => setModalOpen(true)}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Enquiries Logged" description="Log a walk-in, phone or website admission enquiry to start tracking leads." actionLabel="Log Enquiry" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Log Admission Enquiry"
        icon={UserPlus}
        submitLabel="Log Enquiry"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentName', label: 'Student Name', required: true },
          { name: 'parentName', label: 'Parent Name' },
          { name: 'phone', label: 'Phone', required: true },
          { name: 'email', label: 'Email' },
          { name: 'classAppliedFor', label: 'Class Applied For' },
          { name: 'source', label: 'Source', type: 'select', options: SOURCES.map((s) => ({ value: s, label: s.replace('_', ' ') })) },
          { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default EnquiryManagementPage;
