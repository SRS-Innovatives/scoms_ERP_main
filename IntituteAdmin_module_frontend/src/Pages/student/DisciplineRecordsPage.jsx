import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import disciplineService from '../../services/disciplineService';
import studentService from '../../services/studentService';
import { ShieldAlert } from 'lucide-react';

const emptyForm = { studentId: '', incidentDate: new Date().toISOString().slice(0, 10), category: 'MINOR', description: '', actionTaken: '' };
const CATEGORIES = ['MINOR', 'MAJOR', 'SEVERE'];
const STATUSES = ['OPEN', 'RESOLVED'];

const CATEGORY_STYLES = {
  MINOR: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  MAJOR: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  SEVERE: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

export const DisciplineRecordsPage = () => {
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
      const [recordsRes, studentsRes] = await Promise.all([disciplineService.getAll(), studentService.getAll()]);
      setRecords(recordsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      notifyError(`Failed to load discipline records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await disciplineService.create(form);
      notifySuccess('Discipline record logged successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to log record: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (row, status) => {
    try {
      await disciplineService.update(row.id, { status });
      notifySuccess(`Record marked ${status}`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update: ${error.message}`);
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
    { header: 'Date', key: 'incidentDate', render: (val) => new Date(val).toLocaleDateString() },
    { header: 'Category', key: 'category', render: (val) => <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${CATEGORY_STYLES[val]}`}>{val}</span> },
    { header: 'Description', key: 'description', render: (val) => <span className="text-xs">{val}</span> },
    { header: 'Reported By', key: 'reportedBy', render: (val) => val ? `${val.firstName} ${val.lastName}` : '—' },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 ${val === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ];

  const filtered = records.filter((r) =>
    `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Discipline</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Log and track student conduct incidents through to resolution</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student name..."
        addLabel="Log Incident"
        onAddClick={() => setModalOpen(true)}
        onRefreshClick={fetchAll}
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Discipline Records" description="Log a student conduct incident to start tracking it." actionLabel="Log Incident" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Log Discipline Incident"
        icon={ShieldAlert}
        submitLabel="Log Incident"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` })) },
          { name: 'incidentDate', label: 'Incident Date', type: 'date', required: true },
          { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
          { name: 'description', label: 'Description', type: 'textarea', required: true, span: 'full' },
          { name: 'actionTaken', label: 'Action Taken', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default DisciplineRecordsPage;
