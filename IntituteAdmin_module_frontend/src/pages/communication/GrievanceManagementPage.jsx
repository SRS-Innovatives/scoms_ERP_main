import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import grievanceService from '../../services/grievanceService';

const STATUS_STYLES = {
  SUBMITTED: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-sky-100 text-sky-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS = { SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', RESOLVED: 'Resolved' };

export const GrievanceManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ status: '', resolution: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await grievanceService.getAll();
      setGrievances(res.data || []);
    } catch (error) {
      notifyError(`Failed to load grievances: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openResolve = (row) => {
    setActive(row);
    setForm({ status: row.status === 'SUBMITTED' ? 'UNDER_REVIEW' : row.status, resolution: row.resolution || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grievanceService.update(active.id, form);
      notifySuccess(`Grievance "${active.subject}" updated.`);
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update grievance: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Student', key: 'student', sortable: false, render: (val) => val ? `${val.firstName} ${val.lastName} (${val.rollNumber || val.admissionNumber})` : '—' },
    { header: 'Subject', key: 'subject', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Description', key: 'description', sortable: false, render: (val) => <span className="line-clamp-1 max-w-xs inline-block">{val}</span> },
    { header: 'Filed On', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[val] || 'bg-slate-100 text-slate-700'}`}>{STATUS_LABELS[val] || val}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_id, row) => (
        <button onClick={() => openResolve(row)} className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5" /> {row.status === 'RESOLVED' ? 'Update' : 'Review'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Grievances & Complaints</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Confidential complaints filed by students — review and log a resolution.</p>
      </div>

      {!loading && grievances.length === 0 ? (
        <EmptyState title="No Grievances Filed" description="Student complaints will appear here as they're submitted." icon={ShieldAlert} />
      ) : (
        <DataTable columns={columns} data={grievances} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={active ? `Review: ${active.subject}` : 'Review Grievance'}
        subtitle={active?.description}
        icon={ShieldAlert}
        submitLabel="Save"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'RESOLVED', label: 'Resolved' },
            ],
          },
          { name: 'resolution', label: 'Resolution Notes (shown to the student)', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default GrievanceManagementPage;
