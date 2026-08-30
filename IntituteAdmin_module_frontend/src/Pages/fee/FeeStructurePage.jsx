import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Wallet, Trash2 } from 'lucide-react';
import feeService from '../../services/feeService';
import academicYearService from '../../services/academicYearService';
import courseService from '../../services/courseService';

const CATEGORY_OPTIONS = [
  { value: 'TUITION_FEE', label: 'Tuition Fee' },
  { value: 'EXAM_FEE', label: 'Examination Fee' },
  { value: 'LIBRARY_FEE', label: 'Library Fee' },
  { value: 'TRANSPORT_FEE', label: 'Transport Fee' },
  { value: 'HOSTEL_FEE', label: 'Hostel Fee' },
  { value: 'LAB_FEE', label: 'Laboratory Fee' },
  { value: 'ADMISSION_FEE', label: 'Admission Fee' },
  { value: 'DEVELOPMENT_FEE', label: 'Development Fee' },
  { value: 'OTHER_FEE', label: 'Other Fee' },
];

const emptyForm = { name: '', category: 'TUITION_FEE', academicYearId: '', courseId: '', totalAmount: '', dueDate: '', lateFeePerDay: '0' };

export const FeeStructurePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [structures, setStructures] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [structRes, yearRes, courseRes] = await Promise.all([feeService.getStructures(), academicYearService.getAll(), courseService.getAll()]);
      setStructures(structRes.data || []);
      setAcademicYears(yearRes.data || []);
      setCourses(courseRes.data || []);
    } catch (error) {
      notifyError(`Failed to load fee structures: ${error.message}`);
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
      await feeService.createStructure(form);
      notifySuccess(`Fee structure "${form.name}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create fee structure: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await feeService.deleteStructure(id);
      notifySuccess('Fee structure removed.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to remove fee structure: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Structure Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Course', key: 'course', sortable: false, render: (val) => val?.name || 'All Courses' },
    { header: 'Fee Category', key: 'category', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{val?.replace('_', ' ')}</span> },
    { header: 'Academic Year', key: 'academicYear', sortable: false, render: (val) => val?.yearName },
    { header: 'Assignments', key: '_count', sortable: false, render: (val) => `${val?.assignments ?? 0} students` },
    { header: 'Amount (₹)', key: 'totalAmount', render: (val) => <span className="font-mono font-bold text-emerald-600">₹{val.toLocaleString()}</span> },
    { header: 'Due Date', key: 'dueDate', render: (val) => <span className="font-mono text-rose-600 font-semibold">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Late Fine / Day', key: 'lateFeePerDay', render: (val) => <span className="font-mono">₹{val}/day</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const filtered = structures.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Structure Master Configuration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Map fee amounts, due dates, and late payment fines per course & category</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create Fee Structure" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Fee Structures Yet" description="Create your institution's first fee structure to get started." actionLabel="Create Fee Structure" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Create Fee Structure"
        icon={Wallet}
        submitLabel="Create Structure"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Structure Name (e.g. Annual Fee Class 10)', required: true, span: 'full' },
          { name: 'category', label: 'Fee Category', type: 'select', required: true, options: CATEGORY_OPTIONS },
          { name: 'academicYearId', label: 'Academic Year', type: 'select', required: true, options: academicYears.map((y) => ({ value: y.id, label: y.yearName })) },
          { name: 'courseId', label: 'Course (optional — leave blank for all)', type: 'select', options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { name: 'totalAmount', label: 'Total Amount (₹)', type: 'number', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'lateFeePerDay', label: 'Late Fine / Day (₹)', type: 'number' },
        ]}
      />
    </div>
  );
};

export default FeeStructurePage;
