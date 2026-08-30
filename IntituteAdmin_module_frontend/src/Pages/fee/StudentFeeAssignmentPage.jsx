import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { UserPlus } from 'lucide-react';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';

const emptyForm = { feeStructureId: '', studentId: '', discountAmount: '0', scholarshipName: '', scholarshipRef: '' };

export const StudentFeeAssignmentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, structRes, studentRes] = await Promise.all([feeService.getAssignments(), feeService.getStructures(), studentService.getAll()]);
      setAssignments(assignRes.data || []);
      setStructures(structRes.data || []);
      setStudents(studentRes.data || []);
    } catch (error) {
      notifyError(`Failed to load fee assignments: ${error.message}`);
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
      await feeService.assignFee(form);
      notifySuccess('Fee structure assigned to student successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to assign fee: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Roll No', key: 'student', sortable: false, render: (val) => <span className="font-mono font-bold text-indigo-600">{val?.rollNumber}</span> },
    { header: 'Student Name', key: 'student2', sortable: false, render: (_, row) => <span className="font-bold text-slate-900 dark:text-white">{row.student?.firstName} {row.student?.lastName}</span> },
    { header: 'Course', key: 'student3', sortable: false, render: (_, row) => row.student?.course?.name },
    { header: 'Fee Structure', key: 'feeStructure', sortable: false, render: (val) => val?.name },
    { header: 'Total (₹)', key: 'totalAmount', render: (val) => <span className="font-mono">₹{val.toLocaleString()}</span> },
    { header: 'Scholarship / Discount (₹)', key: 'discountAmount', render: (val) => <span className="font-semibold text-emerald-700">{val > 0 ? `₹${val.toLocaleString()}` : '—'}</span> },
    { header: 'Net Payable (₹)', key: 'dueAmount', render: (val, row) => <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(row.totalAmount - row.discountAmount).toLocaleString()}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Individual Student Fee Assignment</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Custom fee structure assignment with scholarship / concession waivers per student</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          <UserPlus className="w-4 h-4" /> Assign Fee to Student
        </button>
      </div>

      {!loading && assignments.length === 0 ? (
        <EmptyState title="No Fee Assignments Yet" description="Assign a fee structure to an individual student to get started." actionLabel="Assign Fee to Student" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={assignments} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Assign Fee Structure to Student"
        icon={UserPlus}
        submitLabel="Assign Fee"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, span: 'full', options: students.map((s) => ({ value: s.id, label: `${s.rollNumber} — ${s.firstName} ${s.lastName}` })) },
          { name: 'feeStructureId', label: 'Fee Structure', type: 'select', required: true, span: 'full', options: structures.map((s) => ({ value: s.id, label: `${s.name} (₹${s.totalAmount.toLocaleString()})` })) },
          { name: 'discountAmount', label: 'Scholarship / Discount Amount (₹)', type: 'number' },
          { name: 'scholarshipName', label: 'Scholarship Scheme Name (optional)' },
          { name: 'scholarshipRef', label: 'Govt Sanction / Reference No (optional)' },
        ]}
      />
    </div>
  );
};

export default StudentFeeAssignmentPage;
