import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Award } from 'lucide-react';
import examService from '../../services/examService';
import academicYearService from '../../services/academicYearService';

const emptyForm = { name: '', examType: 'UNIT_TEST', academicYearId: '', startDate: '', endDate: '' };

export const ExamSetupPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, yearRes] = await Promise.all([examService.getExams(), academicYearService.getAll()]);
      setExams(examRes.data || []);
      setAcademicYears(yearRes.data || []);
    } catch (error) {
      notifyError(`Failed to load exams: ${error.message}`);
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
      await examService.createExam(form);
      notifySuccess(`Exam "${form.name}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create exam: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await examService.updateExamStatus(id, status);
      notifySuccess(`Exam marked as ${status}.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update status: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Exam Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Category', key: 'examType', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{val?.replace('_', ' ')}</span> },
    { header: 'Academic Year', key: 'academicYear', sortable: false, render: (val) => val?.yearName },
    { header: 'Schedules', key: '_count', sortable: false, render: (val) => `${val?.schedules ?? 0} Subjects` },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(id, e.target.value)}
          className="text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
        </select>
      ),
    },
  ];

  const filtered = exams.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Examination Setup Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure End Semester Exams, Internal Assessment Tests (CAT/IA), and Unit Tests</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create New Exam" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Exams Created Yet" description="Create your institution's first exam to get started." actionLabel="Create New Exam" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Create New Exam"
        subtitle="Define the exam window — you'll add per-subject schedules next"
        icon={Award}
        submitLabel="Create Exam"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Exam Title (e.g. Mid Term Examination 2026)', required: true, span: 'full' },
          {
            name: 'examType',
            label: 'Category',
            type: 'select',
            required: true,
            options: [
              { value: 'UNIT_TEST', label: 'Unit Test' },
              { value: 'MID_TERM', label: 'Mid Term' },
              { value: 'FINAL', label: 'Final / End Semester' },
            ],
          },
          {
            name: 'academicYearId',
            label: 'Academic Year',
            type: 'select',
            required: true,
            options: academicYears.map((y) => ({ value: y.id, label: y.yearName })),
          },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
        ]}
      />
    </div>
  );
};

export default ExamSetupPage;
