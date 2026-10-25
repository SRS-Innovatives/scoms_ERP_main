import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import healthService from '../../services/healthService';
import studentService from '../../services/studentService';
import { HeartPulse } from 'lucide-react';

const emptyForm = { studentId: '', visitDate: new Date().toISOString().slice(0, 10), symptoms: '', diagnosis: '', actionTaken: '', referredToHospital: false, parentNotified: false };

export const HealthRecordsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, studentsRes] = await Promise.all([healthService.getAll(), studentService.getAll()]);
      setRecords(recordsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      notifyError(`Failed to load health records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await healthService.create(form);
      notifySuccess('Health record logged successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to log record: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student', key: 'student',
      render: (val) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val?.firstName} {val?.lastName}</p>
          <p className="text-[10px] text-slate-400">{val?.admissionNumber}</p>
        </div>
      ),
    },
    { header: 'Visit Date', key: 'visitDate', render: (val) => new Date(val).toLocaleDateString() },
    { header: 'Symptoms', key: 'symptoms', render: (val) => val || '—' },
    { header: 'Diagnosis / Action', key: 'diagnosis', render: (val, row) => <span className="text-xs">{val || row.actionTaken || '—'}</span> },
    {
      header: 'Referred', key: 'referredToHospital', sortable: false,
      render: (val) => val ? <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">Hospital</span> : <span className="text-slate-400 text-xs">—</span>,
    },
    {
      header: 'Parent Notified', key: 'parentNotified', sortable: false,
      render: (val) => val ? <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Yes</span> : <span className="text-slate-400 text-xs">No</span>,
    },
  ];

  const filtered = records.filter((r) =>
    `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Health & Medical Records</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Log school/college infirmary visits, diagnosis and hospital referrals</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student name..."
        addLabel="Log Visit"
        onAddClick={() => setModalOpen(true)}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Health Records" description="Log an infirmary visit to start tracking student health incidents." actionLabel="Log Visit" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Log Health Record"
        icon={HeartPulse}
        submitLabel="Log Visit"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })) },
          { name: 'visitDate', label: 'Visit Date', type: 'date', required: true },
          { name: 'symptoms', label: 'Symptoms', span: 'full' },
          { name: 'diagnosis', label: 'Diagnosis', span: 'full' },
          { name: 'actionTaken', label: 'Action Taken', type: 'textarea', span: 'full' },
          { name: 'referredToHospital', label: 'Referred to Hospital', type: 'checkbox' },
          { name: 'parentNotified', label: 'Parent Notified', type: 'checkbox' },
        ]}
      />
    </div>
  );
};

export default HealthRecordsPage;
